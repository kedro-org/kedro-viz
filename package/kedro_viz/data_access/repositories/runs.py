"""`kedro_viz.data_access.repositories.runs` defines repository to
centralise access to runs data from the session store."""
# pylint: disable=missing-class-docstring,missing-function-docstring
import logging
import fsspec
from functools import wraps
from pathlib import Path
from typing import Callable, Dict, Iterable, List, Optional

from sqlalchemy.orm import sessionmaker

from kedro.io.core import get_protocol_and_path

from kedro_viz.models.experiment_tracking import RunModel, UserRunDetailsModel

logger = logging.getLogger(__name__)


def check_db_read_session(method: Callable) -> Callable:
    """Decorator that checks whether the repository instance can create a database session.
    If not, return None for all repository methods."""

    @wraps(method)
    def func(self: "RunsRepository", *method_args, **method_kwargs):
        if not self._db_read_session_class:  # pylint: disable=protected-access
            return None
        return method(self, *method_args, **method_kwargs)

    return func


def check_db_write_session(method: Callable) -> Callable:
    """Decorator that checks whether the repository instance can create a database session.
    If not, return None for all repository methods."""

    @wraps(method)
    def func(self: "RunsRepository", *method_args, **method_kwargs):
        if not self._db_write_session_class:  # pylint: disable=protected-access
            return None
        return method(self, *method_args, **method_kwargs)

    return func


class RunsRepository:
    _db_read_session_class: Optional[sessionmaker]
    _db_write_session_class: Optional[sessionmaker]
    _local_session_store_location: Optional[Path]
    _cloud_session_store_location: Optional[str]
    last_run_id: Optional[str]

    def __init__(self,
                 db_read_session_class: Optional[sessionmaker] = None,
                 db_write_session_class: Optional[sessionmaker] = None,
                 local_session_store_location: Optional[Path] = None,
                 cloud_session_store_location: Optional[str] = None
                 ):
        self._db_read_session_class = db_read_session_class
        self._db_write_session_class = db_write_session_class
        self._local_session_store_location = local_session_store_location
        self._cloud_session_store_location = cloud_session_store_location
        self.last_run_id = None

    def set_db_read_session(self, db_session_class: sessionmaker):
        """Sqlite db connection session"""
        self._db_read_session_class = db_session_class

    def set_db_write_session(self, db_session_class: sessionmaker):
        """Sqlite db connection session"""
        self._db_write_session_class = db_session_class

    def set_local_session_store_location(self, local_session_store_location: Path):
        """Sqlite db connection session"""
        self._local_session_store_location = local_session_store_location

    def set_cloud_session_store_location(self, cloud_session_store_location: str):
        """Sqlite db connection session"""
        self._cloud_session_store_location = cloud_session_store_location

    @check_db_write_session
    def add_run(self, run: RunModel):
        with self._db_write_session_class.begin() as session:  # type: ignore
            session.add(run)

    @check_db_read_session
    def get_all_runs(
        self, limit_amount: Optional[int] = None
    ) -> Optional[Iterable[RunModel]]:
        all_runs = (
            self._db_read_session_class()  # type: ignore
            .query(RunModel)
            .order_by(RunModel.id.desc())
        )

        if limit_amount:
            all_runs = all_runs.limit(limit_amount)
        all_runs = all_runs.all()

        if all_runs:
            self.last_run_id = all_runs[0].id
        return all_runs

    @check_db_read_session
    def get_run_by_id(self, run_id: str) -> Optional[RunModel]:
        return self._db_read_session_class().query(RunModel).get(run_id)  # type: ignore

    @check_db_read_session
    def get_runs_by_ids(self, run_ids: List[str]) -> Optional[Iterable[RunModel]]:
        return (
            self._db_read_session_class()  # type: ignore
            .query(RunModel)
            .filter(RunModel.id.in_(run_ids))
            .all()
        )

    @check_db_read_session
    def get_user_run_details(self, run_id: str) -> Optional[UserRunDetailsModel]:
        return (
            self._db_read_session_class()  # type: ignore
            .query(UserRunDetailsModel)
            .filter(UserRunDetailsModel.run_id == run_id)
            .first()
        )

    @check_db_read_session
    def get_new_runs(self) -> Optional[Iterable[RunModel]]:
        query = self._db_read_session_class().query(RunModel)  # type: ignore

        if self.last_run_id:
            query = query.filter(RunModel.id > self.last_run_id)

        return query.order_by(RunModel.id.desc()).all()

    @check_db_read_session
    def get_user_run_details_by_run_ids(
        self, run_ids: List[str]
    ) -> Optional[Dict[str, UserRunDetailsModel]]:
        return {
            user_run_details.run_id: user_run_details
            for user_run_details in self._db_read_session_class()  # type: ignore
            .query(UserRunDetailsModel)
            .filter(UserRunDetailsModel.run_id.in_(run_ids))
            .all()
        }

    @check_db_write_session
    def create_or_update_user_run_details(
        self, run_id: str, title: str, bookmark: bool, notes: str
    ) -> Optional[UserRunDetailsModel]:
        with self._db_write_session_class.begin() as session:  # type: ignore
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
        if(self._cloud_session_store_location):
            protocol, _ = get_protocol_and_path(self._cloud_session_store_location)
            fs = fsspec.filesystem(protocol)
            with open(self._local_session_store_location, 'rb') as file:
                with fs.open(f'{self._cloud_session_store_location}/ivan.db', 'wb') as s3f:
                    s3f.write(file.read())

        return user_run_details
