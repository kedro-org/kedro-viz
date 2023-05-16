"""kedro_viz.intergrations.kedro.sqlite_store is a child of BaseSessionStore
which stores sessions data in the SQLite database"""
# pylint: disable=no-member

import json
import logging
from pathlib import Path
from typing import Any

from kedro.framework.session.store import BaseSessionStore

from kedro_viz.database import make_db_session_factory
from kedro_viz.models.experiment_tracking import RunModel

logger = logging.getLogger(__name__)


def _is_json_serializable(obj: Any):
    try:
        json.dumps(obj)
        return True
    except (TypeError, OverflowError):
        return False


class SQLiteStore(BaseSessionStore):
    """Stores the session data on the sqlite db."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._db_session_class = make_db_session_factory(self.location)

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

        with self._db_session_class.begin() as session:
            session.add(RunModel(id=self._session_id, blob=self.to_json()))
