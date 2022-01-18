"""`kedro_viz.data_access.repositories.tags` defines repository to
centralise access to runs data."""
# pylint: disable=missing-class-docstring,missing-function-docstring
import logging
from functools import wraps
from typing import Callable, Dict, Iterable, List, Optional

from sqlalchemy.orm import sessionmaker

from kedro_viz.models.experiments_tracking import RunModel, UserRunDetailsModel

logger = logging.getLogger(__name__)


def check_db_session(method: Callable) -> Callable:
    """Decorator that checks whether the repository instance can create a database session.
    If not, return None for all repository methods."""

    @wraps(method)
    def func(self: "RunsRepository", *method_args, **method_kwargs):
        if not self._db_session:
            return None
        return method(self, *method_args, **method_kwargs)

    return func


class RunsRepository:
    _db_session: Optional[sessionmaker]

    def __init__(self, db_session: Optional[sessionmaker] = None):
        self._db_session = db_session

    @property
    def db_session(self):  # pragma: no cover
        """Sqlite db connection session"""
        return self._db_session

    @db_session.setter
    def db_session(self, db_session: Optional[sessionmaker]):
        self._db_session = db_session

    @check_db_session
    def get_all_runs(self) -> Optional[Iterable[RunModel]]:
        with self._db_session.begin() as session:
            return session.query(RunModel).order_by(RunModel.id.desc()).all()

    @check_db_session
    def get_run_by_id(self, run_id: str) -> Optional[RunModel]:
        with self._db_session.begin() as session:
            return session.query(RunModel).get(run_id)

    @check_db_session
    def get_runs_by_ids(self, run_ids: List[str]) -> Optional[Iterable[RunModel]]:
        with self._db_session.begin() as session:
            return session.query(RunModel).filter(RunModel.id.in_(run_ids)).all()

    @check_db_session
    def get_user_run_details(self, run_id: str) -> Optional[UserRunDetailsModel]:
        with self._db_session.begin() as session:
            return (
                session.query(UserRunDetailsModel)
                .filter(UserRunDetailsModel.run_id == run_id)
                .first()
            )

    @check_db_session
    def create_or_update_user_run_details(
        self, updated_user_run_details: Dict
    ) -> Optional[UserRunDetailsModel]:
        with self._db_session.begin() as session:
            user_run_details = (
                session.query(UserRunDetailsModel)
                .filter(
                    UserRunDetailsModel.run_id == updated_user_run_details["run_id"]
                )
                .first()
            )
            if not user_run_details:
                session.add(UserRunDetailsModel(**updated_user_run_details))
            else:
                for key, value in updated_user_run_details.items():
                    setattr(user_run_details, key, value)

        return user_run_details
