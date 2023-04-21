"""kedro_viz.intergrations.kedro.sqlite_store is a child of BaseSessionStore
which stores sessions data in the SQLite database"""

import getpass
import json
import logging
import os
import uuid
from pathlib import Path
from typing import Any, Generator, List

import fsspec
from kedro.framework.session.store import BaseSessionStore
from kedro.io.core import get_protocol_and_path
from sqlalchemy import MetaData, create_engine, event
from sqlalchemy.orm import sessionmaker

from kedro_viz.database import create_db_engine
from kedro_viz.models.experiment_tracking import Base, RunModel

logger = logging.getLogger(__name__)


def get_db(session_class: sessionmaker) -> Generator:
    """Makes connection to the database"""
    try:
        database = session_class()
        yield database
    finally:
        database.close()


def _get_dbname():
    username = os.environ.get("KEDRO_SQLITE_STORE_USERNAME")
    if username is not None:
        return f"{username}.db"
    else:
        return f"{getpass.getuser()}.db"


def _is_json_serializable(obj: Any):
    try:
        json.dumps(obj)
        return True
    except (TypeError, OverflowError):
        return False


class SQLiteStore(BaseSessionStore):
    """Stores the session data on the sqlite db."""

    def __init__(self, *args, remote_path: str = None, **kwargs):
        """Sets remote_path for Collaborative Experiment Tracking"""
        super().__init__(*args, **kwargs)
        self._remote_path = remote_path

    @property
    def location(self) -> Path:
        """Returns location of the sqlite_store database"""
        return Path(self._path) / "session_store.db"

    @property
    def remote_location(self) -> Path:
        """Returns location of the sqlite_store database"""
        return self._remote_path

    def _to_json(self) -> str:
        """Returns session_store information in json format after converting PosixPath to string"""
        session_dict = {}
        for key, value in self.data.items():
            if key == "git":
                try:
                    import git  # pylint: disable=import-outside-toplevel

                    branch = git.Repo(search_parent_directories=True).active_branch
                    value["branch"] = branch.name
                except ImportError as exc:  # pragma: no cover
                    logger.warning("%s:%s", exc.__class__.__name__, exc.msg)

            if _is_json_serializable(value):
                session_dict[key] = value
            else:
                session_dict[key] = str(value)
        return json.dumps(session_dict)

    def save(self):
        """Save the session store info on db ."""
        engine, session_class = create_db_engine(self.location)
        Base.metadata.create_all(bind=engine)
        database = next(get_db(session_class))

        session_store_data = RunModel(id=self._session_id, blob=self._to_json())
        database.add(session_store_data)
        database.commit()
        self.sync()

    def _upload(self):
        """Uploads the session store database file to the specified remote path on a cloud storage service."""
        # Connect to the remote file system
        protocol, _ = get_protocol_and_path(self._remote_path)
        db_name = _get_dbname()
        fs = fsspec.filesystem(protocol)
        # Open the local database file and upload it to the remote path
        with open(self.location, "rb") as file:
            with fs.open(f"{self._remote_path}/{db_name}", "wb") as s3f:
                s3f.write(file.read())

    def _download(self) -> List[str]:
        """Downloads all the session store database files from the specified remote path on a cloud storage service
        to your local project.
        Note: All the database files are deleted after they are merged to the main session_store.db.

        Returns:
        A list of local filepath in string format for all the databases

        """

        # Connect to the remote file system
        protocol, _ = get_protocol_and_path(self._remote_path)
        fs = fsspec.filesystem(protocol)
        # Find all the databases at the remote path
        databases = fs.glob(f"{self._remote_path}/*.db")
        databases_location = []
        # Download each database to a local filepath
        for database in databases:
            database_name = Path(database).name
            with fs.open(database, "rb") as file:
                db_data = file.read()
                db_loc = f"{self._path}/{database_name}"
                with open(db_loc, "wb") as temp_db:
                    temp_db.write(db_data)
            databases_location.append(db_loc)
        # Return the list of local filepaths
        return databases_location

    def _merge(self, databases_location: List[str]):
        """Merges all the session store databases stored at the specified locations into the user's local session_store.db

        Notes:
        - This method uses multiple SQLAlchemy engines to connect user's session_store.db and also to connect to all the downloaded db files.
        - It is assumed that all the databases share the same schema.
        - In the version 1.0 - we only merge the runs table which contains all the experiments.
        - The downloaded database files are deleted after the runs are merged with the user's local session_store.db

        Args:
            database_location:  A list of local filepath in string format for all the databases

        """

        # Connect to the user's local session_store.db
        engine, session_class = create_db_engine(self.location)
        Base.metadata.create_all(bind=engine)
        database = next(get_db(session_class))

        temp_engine = None
        # Iterate through each downloaded database
        for db_loc in databases_location:
            if temp_engine:
                temp_engine.dispose()
            # Open a connection to the downloaded database
            temp_engine = create_engine(f"sqlite:///{db_loc}")
            with temp_engine.connect() as database_conn:
                db_metadata = MetaData()
                db_metadata.reflect(bind=temp_engine)
                # Merge data from the 'runs' table
                for table_name, table_obj in db_metadata.tables.items():
                    if table_name == "runs":
                        data = database_conn.execute(table_obj.select()).fetchall()
                        for row in data:
                            row_dict = row._asdict()
                            session_store_data = RunModel(**row_dict)
                            try:
                                database.add(session_store_data)
                                database.commit()
                            except Exception as e:
                                database.rollback()
                                logging.exception(f"Failed to add runs to the {database}: {e}")
            # Close the connection to the downloaded database and delete it
            temp_engine.dispose()
            os.remove(db_loc)

    def sync(self):
        """
        Synchronizes the user's local session_store.db with remote databases stored on a cloud storage service.

        Notes:
        - First, all the database files at the remote location are downloaded to the local project.
        - Next, the downloaded databases are merged into the user's local session_store.db.
        - Finally, the user's local session_store.db is uploaded to the remote location to ensure that it has the most up-to-date runs.
        """

        if self.remote_location:
            downloaded_dbs = self._download()
            self._merge(downloaded_dbs)
            self._upload()
