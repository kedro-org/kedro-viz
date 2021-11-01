# Copyright 2021 QuantumBlack Visual Analytics Limited
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
# OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
# NONINFRINGEMENT. IN NO EVENT WILL THE LICENSOR OR OTHER CONTRIBUTORS
# BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN
# ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF, OR IN
# CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
#
# The QuantumBlack Visual Analytics Limited ("QuantumBlack") name and logo
# (either separately or in combination, "QuantumBlack Trademarks") are
# trademarks of QuantumBlack. The License does not grant you any right or
# license to the QuantumBlack Trademarks. You may not use the QuantumBlack
# Trademarks or any confusingly similar mark as a trademark for your product,
# or use the QuantumBlack Trademarks in any other manner that might cause
# confusion in the marketplace, including but not limited to in advertising,
# on websites, or on software.
#
# See the License for the specific language governing permissions and
# limitations under the License.
import json
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from kedro_viz.integrations.kedro.sqlite_store import SQLiteStore, get_db
from kedro_viz.models.run_model import Base, RunModel


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
