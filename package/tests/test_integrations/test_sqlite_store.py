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
import logging
from pathlib import Path
from attr import set_run_validators
import pytest
from kedro_viz.integrations.kedro.sqlite_store import SQLiteStore, get_db
from kedro_viz.models.run_model import RunModel, Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from unittest.mock import patch

FAKE_SESSION_ID = "fake_session_id"

@pytest.fixture
def store_path(tmp_path):
    return Path(tmp_path)

@pytest.fixture
def setup_db(store_path):
    engine = create_engine(f'sqlite:///{store_path}.session_store.db')
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    # session = Session()
    yield Session


@pytest.fixture
def example_dataset(setup_db):
    session = setup_db
    run_1 = RunModel(id='1534326',blob='Hello World 1')
    run_2 = RunModel(id='41312339',blob='Hello World 2')
    session.add(run_1)
    session.add(run_2)
    session.commit()
    yield session

@pytest.fixture
def example_db(setup_db):
    session_class = setup_db
    db = session_class()
    yield db
    db.close()

class TestSQLiteStore:
    def test_empty(self, store_path):
        sqlite_store = SQLiteStore(str(store_path), FAKE_SESSION_ID)
        assert sqlite_store == {}
        assert sqlite_store.location == store_path/ "session_store.db"
        

    @patch("kedro_viz.database.create_db_engine")
    @patch("kedro_viz.integrations.kedro.sqlite_store.get_db")
    def test_save(self, patched_db_session, patched_db_conn, store_path, example_db):
        db_session = example_dataset
        sqlite_store = SQLiteStore(str(store_path), FAKE_SESSION_ID)
        sqlite_store["path"] = store_path
        sqlite_store["session_id"] = FAKE_SESSION_ID
        patched_db_conn.return_value = ""
        patched_db_session.return_value = setup_db
        sqlite_store.save()
        for s in db_session.query(RunModel).all():
            print(s)
        assert 3==2
        

        

