"""kedro_viz.intergrations.kedro.sqlite_store is a child of BaseSessionStore
which stores sessions data in the SQLite database"""
# pylint: disable=too-many-ancestors

import json
import logging
from pathlib import Path
from typing import Any, Generator, Type

from kedro.framework.session.store import BaseSessionStore
from sqlalchemy.orm.session import Session

from kedro_viz.database import create_db_engine
from kedro_viz.models.experiments_tracking import Base, RunModel

logger = logging.getLogger(__name__)


def get_db(session_class: Type[Session]) -> Generator:
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
