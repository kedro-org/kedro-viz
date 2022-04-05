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
        if not self._db_session_class:  # pylint: disable=protected-access
            return None
        return method(self, *method_args, **method_kwargs)

    return func


class RunsRepository:
    _db_session_class: Optional[sessionmaker]
    last_run_id: Optional[str]

    def __init__(self, db_session_class: Optional[sessionmaker] = None):
        self._db_session_class = db_session_class
        self.last_run_id = None

    def set_db_session(self, db_session_class: sessionmaker):
        """Sqlite db connection session"""
        self._db_session_class = db_session_class

    @check_db_session
    def add_run(self, run: RunModel):
        with self._db_session_class.begin() as session:  # type: ignore
            session.add(run)

    @check_db_session
    def get_all_runs(self) -> Optional[Iterable[RunModel]]:
        all_runs = (
            self._db_session_class()  # type: ignore
            .query(RunModel)
            .order_by(RunModel.id.desc())
            .all()
        )
        if all_runs:
            self.last_run_id = all_runs[0].id
        return all_runs

    @check_db_session
    def get_run_by_id(self, run_id: str) -> Optional[RunModel]:
        return self._db_session_class().query(RunModel).get(run_id)  # type: ignore

    @check_db_session
    def get_runs_by_ids(self, run_ids: List[str]) -> Optional[Iterable[RunModel]]:
        return (
            self._db_session_class()  # type: ignore
            .query(RunModel)
            .filter(RunModel.id.in_(run_ids))
            .all()
        )

    @check_db_session
    def get_user_run_details(self, run_id: str) -> Optional[UserRunDetailsModel]:
        return (
            self._db_session_class()  # type: ignore
            .query(UserRunDetailsModel)
            .filter(UserRunDetailsModel.run_id == run_id)
            .first()
        )

    @check_db_session
    def get_new_runs(self) -> Optional[Iterable[RunModel]]:
        query = self._db_session_class().query(RunModel)  # type: ignore

        if self.last_run_id:
            query = query.filter(RunModel.id > self.last_run_id)

        return query.order_by(RunModel.id.desc()).all()

    @check_db_session
    def get_user_run_details_by_run_ids(
        self, run_ids: List[str]
    ) -> Optional[Dict[str, UserRunDetailsModel]]:
        return {
            user_run_details.run_id: user_run_details
            for user_run_details in self._db_session_class()  # type: ignore
            .query(UserRunDetailsModel)
            .filter(UserRunDetailsModel.run_id.in_(run_ids))
            .all()
        }

    @check_db_session
    def create_or_update_user_run_details(
        self, run_id: str, title: str, bookmark: bool, notes: str
    ) -> Optional[UserRunDetailsModel]:
        with self._db_session_class.begin() as session:  # type: ignore
            user_run_details = (
                session.query(UserRunDetailsModel)
                .filter(UserRunDetailsModel.run_id == run_id)
                .first()
            )
            if not user_run_details:
                user_run_details = UserRunDetailsModel(
                    run_id=run_id, title=title, bookmark=bookmark, notes=notes
                )
                session.add(user_run_details)
            else:
                user_run_details.title = title
                user_run_details.bookmark = bookmark
                user_run_details.notes = notes
        return user_run_details
