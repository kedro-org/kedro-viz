import json
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from kedro_viz.integrations.kedro.sqlite_store import SQLiteStore, get_db
from kedro_viz.models.experiments_tracking import Base, RunModel


def session_id():
    i = 0
    while True:
        yield f"session_{i}"
        i += 1


@pytest.fixture
def store_path(tmp_path):
    return Path(tmp_path)


@pytest.fixture
def db_session_class(store_path):
    engine = create_engine(f"sqlite:///{store_path}/session_store.db")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    return Session


class TestSQLiteStore:
    def test_empty(self, store_path):
        sqlite_store = SQLiteStore(store_path, next(session_id()))
        assert sqlite_store == {}
        assert sqlite_store.location == store_path / "session_store.db"

    def test_save_single_run(self, store_path, db_session_class):
        sqlite_store = SQLiteStore(store_path, next(session_id()))
        sqlite_store.data = {"project_path": store_path, "project_name": "test"}
        sqlite_store.save()
        db = next(get_db(db_session_class))
        loaded_runs = db.query(RunModel).all()
        assert len(loaded_runs) == 1
        assert json.loads(loaded_runs[0].blob) == {
            "project_path": str(store_path),
            "project_name": "test",
        }

    def test_save_multiple_runs(self, store_path, db_session_class):
        session = session_id()
        sqlite_store = SQLiteStore(store_path, next(session))
        sqlite_store.save()
        db = next(get_db(db_session_class))
        assert db.query(RunModel).count() == 1
        # save another session
        sqlite_store2 = SQLiteStore(store_path, next(session))
        sqlite_store2.save()
        db = next(get_db(db_session_class))
        assert db.query(RunModel).count() == 2

    def test_update_git_branch(self, store_path, mocker):
        sqlite_store = SQLiteStore(store_path, next(session_id()))
        sqlite_store.data = {
            "project_path": store_path,
            "git": {"commit_sha": "123456"},
        }
        mocker.patch("git.Repo.active_branch").name = "test_branch"

        assert sqlite_store.to_json() == json.dumps(
            {
                "project_path": str(store_path),
                "git": {"commit_sha": "123456", "branch": "test_branch"},
            }
        )
