"""kedro_viz.intergrations.kedro.sqlite_store is a child of BaseSessionStore
which stores sessions data in the SQLite database"""
# pylint: disable=no-member

# pylint: disable=broad-exception-caught

import getpass
import json
import logging
import os
from pathlib import Path
from typing import Any, Optional

import fsspec
from kedro.framework.session.store import BaseSessionStore
from kedro.io.core import get_protocol_and_path
from sqlalchemy import create_engine, insert, select
from sqlalchemy.orm import sessionmaker, Session

from kedro_viz.database import make_db_session_factory
from kedro_viz.models.experiment_tracking import RunModel

logger = logging.getLogger(__name__)


def _get_dbname():
    username = os.environ.get("KEDRO_SQLITE_STORE_USERNAME") or getpass.getuser()
    return username + ".db"


def _is_json_serializable(obj: Any):
    try:
        json.dumps(obj)
        return True
    except (TypeError, OverflowError):
        return False


class SQLiteStore(BaseSessionStore):
    """Stores the session data on the sqlite db."""

    def __init__(self, *args, remote_path: Optional[str] = None, **kwargs):
        """Initializes the SQLiteStore object."""
        super().__init__(*args, **kwargs)
        self._db_session_class = make_db_session_factory(self.location)
        self._remote_path = remote_path

        if self.remote_location:
            protocol, _ = get_protocol_and_path(self.remote_location)
            self._remote_fs = fsspec.filesystem(protocol)

    @property
    def location(self) -> str:
        """Returns location of the sqlite_store database"""
        return str(Path(self._path) / "session_store.db")

    @property
    def remote_location(self) -> Optional[str]:
        """Returns the remote location of the sqlite_store database on the cloud"""
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
        """Save the session store info on db and uploads it
        to the cloud if a remote cloud path is provided ."""
        with self._db_session_class.begin() as session:
            session.add(RunModel(id=self._session_id, blob=self._to_json()))
        if self.remote_location:
            self._upload()

    def _upload(self):
        """Uploads the session store database file to the specified
        remote path on the cloud storage."""
        db_name = _get_dbname()
        logger.debug(f"Uploading local session store to remote with name {db_name}...")
        try:
            self._remote_fs.put(self.location, f"{self.remote_location}/{db_name}")
        except Exception as exc:
            logger.exception(exc)

    def _download(self):
        """Downloads all the session store database files
        from the specified remote path on the cloud storage
        to your local project.
        """
        try:
            # In theory we should be able to do this as a single operation:
            # self._remote_fs.get(f"{self.remote_location}/*.db", str(Path(self.location).parent))
            # but this does not seem to work correctly - maybe a bug in fsspec. So instead
            # we do it in two steps.
            remote_dbs = self._remote_fs.glob(f"{self.remote_location}/*.db")
            logger.debug(f"Downloading {len(remote_dbs)} remote session stores to local...")
            self._remote_fs.get(remote_dbs, str(Path(self.location).parent))
        except Exception as exc:
            logger.exception(exc)

    def _merge(self):
        """Merges all the session store databases stored at the
        specified locations into the user's local session_store.db

        Notes:
        - This method uses multiple SQLAlchemy engines to connect to the
        user's session_store.db and to all the other downloaded dbs.
        - It is assumed that all the databases share the same schema.
        - In the version 1.0 - we only merge the runs table which
        contains all the experiments.
        """

        all_new_runs = []

        with self._db_session_class() as session:
            existing_run_ids = session.execute(select(RunModel.id)).scalars().all()

        # Look at all databases in the local session store directory
        # that aren't the actual session_store.db itself.
        downloaded_db_locations = set(Path(self.location).parent.glob("*.db")) - {
            Path(self.location)
        }

        logger.debug(f"Checking {len(downloaded_db_locations)} downloaded session stores for new runs...")
        for downloaded_db_location in downloaded_db_locations:
            engine = create_engine(f"sqlite:///{downloaded_db_location}")
            with Session(engine) as session:
                new_runs = (
                    session.query(RunModel)
                    .filter(RunModel.id.not_in(existing_run_ids))
                    .all()
                )

                existing_run_ids.extend([run.id for run in new_runs])
                all_new_runs.extend(new_runs)
                logger.debug(f"Found {len(new_runs)} new runs in downloaded session store"
                             f" {downloaded_db_location.name}")

        if all_new_runs:
            logger.debug(f"Adding {len(all_new_runs)} new runs to session store...")
            with self._db_session_class.begin() as session:
                for run in all_new_runs:
                    session.merge(run)


    def sync(self):
        """
        Synchronizes the user's local session_store.db with
        remote session_store.db stored on a cloud storage service.
        """

        if self.remote_location:
            self._download()
            # We don't want a failed merge to stop the whole kedro-viz process.
            try:
                self._merge()
            except Exception as exc:
                logger.exception(exc)
            self._upload()
