"""kedro_viz.intergrations.kedro.sqlite_store is a child of BaseSessionStore
which stores sessions data in the SQLite database"""

import json
import os 
import io
import logging
import fsspec
from pathlib import Path
from typing import Any, Generator, Dict, BinaryIO

from kedro.framework.session.store import BaseSessionStore
from kedro.io.core import get_protocol_and_path

from sqlalchemy import create_engine, MetaData
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


def _is_json_serializable(obj: Any):
    try:
        json.dumps(obj)
        return True
    except (TypeError, OverflowError):
        return False


class SQLiteStore(BaseSessionStore):
    """Stores the session data on the sqlite db."""

    @property
    def location(self) -> Path:
        """Returns location of the sqlite_store database"""
        return Path(self._path) / "session_store.db"

    @property
    def s3_location(self) -> Path:
        """Returns location of the sqlite_store database"""
        return self._s3_path

    def to_json(self) -> str:
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
        session_store_data = RunModel(id=self._session_id, blob=self.to_json())
        database.add(session_store_data)
        database.commit()

    def upload(self):
        """Upload the session store db to s3"""
        protocol, _ = get_protocol_and_path(self._s3_path)
        fs = fsspec.filesystem(protocol)
        with open(self.location, 'rb') as file:
            with fs.open(f'{self._s3_path}/ivan.db', 'wb') as s3f:
                s3f.write(file.read())
    
    def download(self) -> Dict[str, BinaryIO]:
        """Download all the dbs from an s3 locations"""
        protocol, _ = get_protocol_and_path(self._path)
        tmp_dir = Path(f'{self._path.parent}/tmp_dbs/')
        tmp_dir.mkdir(parents=True,exist_ok=True)
        fs = fsspec.filesystem(protocol)
        databases = fs.glob(f"{self._s3_path}/*.db")
        downloaded_dbs = {}
        for database in databases:
            with fs.open(database, 'rb') as file:
                db_buffer = io.BytesIO(file.read())
                downloaded_dbs[database] = db_buffer

    
    def merge(self, downloaded_dbs: Dict[str,BinaryIO]): 
        "Merge all dbs to the local session_store.db"
        engine, session_class = create_db_engine(self.location)
        Base.metadata.create_all(bind=engine)
        database = next(get_db(session_class))

        for database_name, db_buffer in downloaded_dbs.items():
            temp_engine = create_engine('sqlite:///:memory:')
            with temp_engine.connect() as database_conn:
                db_metadata = MetaData()
                db_metadata.reflect(bind=temp_engine)
                for table_name, table_obj in db_metadata.tables.items():
                    if table_name == 'runs':
                        data = database_conn.execute(table_obj.select()).fetchall()
                        for row in data:
                            try: 
                                database.add(RunModel(**row.__dict__))
                            except Exception as e:
                                  pass 

    def sync(self):
        self.upload()
        downloaded_dbs = self.download()
        self.merge(downloaded_dbs)      







            
            


   

    

