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
from pathlib import Path, PosixPath

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from kedro_viz.integrations.kedro.sqlite_store import SQLiteStore, get_db
from kedro_viz.models.run_model import Base, RunModel

FAKE_SESSION_ID_1 = "fake_session_id_1"

FAKE_SESSION_ID_2 = "fake_session_id_2"


@pytest.fixture
def store_path(tmp_path):
    return Path(tmp_path)


@pytest.fixture
def dbsession(store_path):
    engine = create_engine(f"sqlite:///{store_path}/session_store.db")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    return Session


class TestSQLiteStore:
    def test_empty(self, store_path):
        sqlite_store = SQLiteStore(str(store_path), FAKE_SESSION_ID_1)
        assert sqlite_store == {}
        assert sqlite_store.location == store_path / "session_store.db"

    def test_save(self, store_path, dbsession):
        sqlite_store = SQLiteStore(str(store_path), FAKE_SESSION_ID_1)
        sqlite_store.data = {"project_path": PosixPath(store_path)}
        sqlite_store.save()
        db = next(get_db(dbsession))
        assert db.query(RunModel).count() == 1
        # save another session
        sqlite_store2 = SQLiteStore(str(store_path), FAKE_SESSION_ID_2)
        sqlite_store2.save()
        db = next(get_db(dbsession))
        assert db.query(RunModel).count() == 2
