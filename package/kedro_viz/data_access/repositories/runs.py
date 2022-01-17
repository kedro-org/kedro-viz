"""`kedro_viz.data_access.repositories.tags` defines repository to
centralise access to runs data."""
# pylint: disable=missing-class-docstring,missing-function-docstring
import logging
from typing import Dict, Iterable, List, Optional, Type

from sqlalchemy.orm.session import Session

from kedro_viz.models.experiments_tracking import RunModel, UserRunDetailsModel

logger = logging.getLogger(__name__)


class RunsRepository:
    _db_session: Optional[Type[Session]]

    def __init__(self, db_session: Optional[Type[Session]] = None):
        self._db_session = db_session

    @property
    def db_session(self):  # pragma: no cover
        """Sqlite db connection session"""
        return self._db_session

    @db_session.setter
    def db_session(self, db_session: Optional[Type[Session]]):
        self._db_session = db_session

    def get_all_runs(self) -> Optional[Iterable[RunModel]]:
        if not self._db_session:
            return None
        with self._db_session.begin() as session:
            return session.query(RunModel).order_by(RunModel.id.desc()).all()

    def get_runs_by_ids(self, run_ids: List[str]) -> Optional[Iterable[RunModel]]:
        if not self._db_session:
            return None

        with self._db_session.begin() as session:
            return session.query(RunModel).filter(RunModel.id.in_(run_ids)).all()

    def get_user_run_details(self, run_id: str) -> Optional[UserRunDetailsModel]:
        if not self._db_session:
            return None

        with self._db_session.begin() as session:
            return (
                session.query(UserRunDetailsModel)
                .filter(UserRunDetailsModel.run_id == run_id)
                .first()
            )

    def create_or_update_user_run_details(
        self, updated_user_run_details: Dict
    ) -> Optional[UserRunDetailsModel]:
        if not self._db_session:
            return None

        with self._db_session.begin() as session:
            user_run_details = (
                session.query(UserRunDetailsModel)
                .filter(
                    UserRunDetailsModel.run_id == updated_user_run_details["run_id"]
                )
                .first()
            )
            if not user_run_details:
                session.add(UserRunDetailsModel(**updated_user_run_details))  # type: ignore
            else:
                for key, value in updated_user_run_details.items():
                    setattr(user_run_details, key, value)

        return user_run_details
