"""kedro_viz.intergrations.kedro.sqlite_store is a child of BaseSessionStore
which stores sessions data in the SQLite database"""
# pylint: disable=no-member, broad-exception-caught

import getpass
import json
import logging
import os
from pathlib import Path
from typing import Any, Optional

import fsspec
from kedro.framework.session.store import BaseSessionStore
from kedro.io.core import get_protocol_and_path
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from kedro_viz.database import make_db_session_factory
from kedro_viz.models.experiment_tracking import RunModel

logger = logging.getLogger(__name__)


def _get_dbname():
    return os.getenv("KEDRO_SQLITE_STORE_USERNAME", getpass.getuser()) + ".db"


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
                except Exception as exc:  # pragma: no cover
                    logger.warning("Something went wrong when fetching git metadata.")
                    logger.warning(exc)

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
        logger.debug(
            """Uploading local session store to %s with name
              %s...""",
            self.remote_location,
            db_name,
        )
        try:
            self._remote_fs.put(self.location, f"{self.remote_location}/{db_name}")
        except Exception as exc:
            logger.exception("Upload failed: %s ", exc)

    def _download(self):
        """Downloads all the session store database files
        from the specified remote path on the cloud storage
        to your local project.
        """
        try:
            # In theory we should be able to do this as a single operation:
            # self._remote_fs.get(f"{self.remote_location}/*.db", str(Path(self.location).parent))
            # but this does not seem to work correctly - maybe a bug in fsspec. So instead
            # we do it in two steps. Also need to add os.sep so it works with older s3fs version.
            # This is a known bug in s3fs - https://github.com/fsspec/s3fs/issues/717
            remote_dbs = self._remote_fs.glob(f"{self.remote_location}/*.db")
            logger.debug(
                "Downloading %s remote session stores to local...", len(remote_dbs)
            )
            for remote_db in remote_dbs:
                self._remote_fs.get(remote_db, str(Path(self.location).parent) + os.sep)
        except Exception as exc:
            logger.exception("Download failed: %s ", exc)

    def _merge(self):
        """Merges all the session store databases stored at the
        specified locations into the user's local session_store.db

        Notes:
        - This method uses multiple SQLAlchemy engines to connect to the
        user's session_store.db and to all the other downloaded dbs.
        - It is assumed that all the databases share the same schema.
        - In the Kedro-viz version 6.2.0 - we only merge the runs table which
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

        logger.debug(
            "Checking %s downloaded session stores for new runs...",
            len(downloaded_db_locations),
        )
        for downloaded_db_location in downloaded_db_locations:
            engine = create_engine(f"sqlite:///{downloaded_db_location}")
            with Session(engine) as session:
                query = select(RunModel).where(RunModel.id.not_in(existing_run_ids))
                new_runs = session.execute(query).scalars().all()

                existing_run_ids.extend([run.id for run in new_runs])
                all_new_runs.extend(new_runs)
                logger.debug(
                    "Found %s new runs in downloaded session store %s",
                    len(new_runs),
                    downloaded_db_location.name,
                )

        if all_new_runs:
            logger.debug("Adding %s new runs to session store...", len(all_new_runs))
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
                logger.exception("Merge failed on sync: %s", exc)
            self._upload()
