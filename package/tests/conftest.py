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
from typing import Dict, Optional
from unittest import mock

import pytest
from fastapi.testclient import TestClient
from kedro.extras.datasets.pandas import CSVDataSet, ParquetDataSet
from kedro.extras.datasets.spark import SparkDataSet
from kedro.io import DataCatalog, MemoryDataSet
from kedro.pipeline import Pipeline, node
from kedro.pipeline.modular_pipeline import pipeline
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from kedro_viz.api import apps
from kedro_viz.data_access import DataAccessManager
from kedro_viz.models.run_model import Base, RunModel
from kedro_viz.server import populate_data


@pytest.fixture
def data_access_manager():
    yield DataAccessManager()


@pytest.fixture
def example_pipelines():
    def process_data(raw_data, train_test_split):
        ...

    def train_model(model_inputs, parameters):
        ...

    data_processing_pipeline = pipeline(
        Pipeline(
            [
                node(
                    process_data,
                    inputs=["raw_data", "params:train_test_split"],
                    outputs="model_inputs",
                    name="process_data",
                    tags=["split"],
                )
            ]
        ),
        namespace="uk.data_processing",
        outputs="model_inputs",
    )
    data_science_pipeline = pipeline(
        Pipeline(
            [
                node(
                    train_model,
                    inputs=["model_inputs", "parameters"],
                    outputs="model",
                    name="train_model",
                    tags=["train"],
                )
            ]
        ),
        namespace="uk.data_science",
        inputs="model_inputs",
    )
    yield {
        "__default__": data_processing_pipeline + data_science_pipeline,
        "data_science": data_science_pipeline,
        "data_processing": data_processing_pipeline,
    }


@pytest.fixture
def example_catalog():
    yield DataCatalog(
        data_sets={
            "uk.data_processing.raw_data": CSVDataSet(filepath="raw_data.csv"),
            "model_inputs": CSVDataSet(filepath="model_inputs.csv"),
            "uk.data_science.model": MemoryDataSet(),
        },
        feed_dict={
            "parameters": {"train_test_split": 0.1, "num_epochs": 1000},
            "params:train_test_split": 0.1,
        },
        layers={
            "raw": {
                "uk.data_processing.raw_data",
            },
            "model_inputs": {"model_inputs"},
        },
    )


@pytest.fixture
def example_transcoded_pipelines():
    def process_data(raw_data, train_test_split):
        ...

    def train_model(model_inputs, parameters):
        ...

    data_processing_pipeline = pipeline(
        Pipeline(
            [
                node(
                    process_data,
                    inputs=["raw_data", "params:train_test_split"],
                    outputs="model_inputs@spark",
                    name="process_data",
                    tags=["split"],
                ),
                node(
                    train_model,
                    inputs=["model_inputs@pandas", "parameters"],
                    outputs="model",
                    name="train_model",
                    tags=["train"],
                ),
            ]
        ),
    )

    yield {
        "__default__": data_processing_pipeline,
        "data_processing": data_processing_pipeline,
    }


@pytest.fixture
def example_transcoded_catalog():
    yield DataCatalog(
        data_sets={
            "model_inputs@pandas": ParquetDataSet(filepath="model_inputs.parquet"),
            "model_inputs@spark": SparkDataSet(filepath="model_inputs.csv"),
        },
        feed_dict={
            "parameters": {"train_test_split": 0.1, "num_epochs": 1000},
            "params:train_test_split": 0.1,
        },
    )


@pytest.fixture
def example_api(
    data_access_manager: DataAccessManager,
    example_pipelines: Dict[str, Pipeline],
    example_catalog: DataCatalog,
    example_session_store_location: Optional[Path],
):
    api = apps.create_api_app_from_project(mock.MagicMock())
    populate_data(
        data_access_manager,
        example_catalog,
        example_pipelines,
        example_session_store_location,
    )
    with mock.patch(
        "kedro_viz.api.responses.data_access_manager", new=data_access_manager
    ), mock.patch("kedro_viz.api.router.data_access_manager", new=data_access_manager):
        yield api


@pytest.fixture
def example_api_no_session_store(
    data_access_manager: DataAccessManager,
    example_pipelines: Dict[str, Pipeline],
    example_catalog: DataCatalog,
):
    api = apps.create_api_app_from_project(mock.MagicMock())
    populate_data(data_access_manager, example_catalog, example_pipelines, None)
    with mock.patch(
        "kedro_viz.api.responses.data_access_manager", new=data_access_manager
    ), mock.patch("kedro_viz.api.router.data_access_manager", new=data_access_manager):
        yield api


@pytest.fixture
def example_transcoded_api(
    data_access_manager: DataAccessManager,
    example_transcoded_pipelines: Dict[str, Pipeline],
    example_transcoded_catalog: DataCatalog,
    example_session_store_location: Optional[Path],
):
    api = apps.create_api_app_from_project(mock.MagicMock())
    populate_data(
        data_access_manager,
        example_transcoded_catalog,
        example_transcoded_pipelines,
        example_session_store_location,
    )
    with mock.patch(
        "kedro_viz.api.responses.data_access_manager", new=data_access_manager
    ), mock.patch("kedro_viz.api.router.data_access_manager", new=data_access_manager):
        yield api


@pytest.fixture
def client(example_api):
    yield TestClient(example_api)


@pytest.fixture
def example_session_store_location(tmp_path):
    yield Path(tmp_path / "session_store.db")


@pytest.fixture
def example_db_session(example_session_store_location):
    engine = create_engine(f"sqlite:///{example_session_store_location}")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture
def example_db_dataset(example_db_session):
    session = example_db_session

    session_data_1 = {
        "package_name": "testsql",
        "project_path": "/Users/Projects/testsql",
        "session_id": "2021-10-21T15.02.12.672Z",
        "cli": {
            "args": [],
            "params": {
                "from_inputs": [],
                "to_outputs": [],
                "from_nodes": [],
                "to_nodes": [],
                "node_names": (),
                "runner": None,
                "parallel": False,
                "is_async": False,
                "env": None,
                "tag": (),
                "load_version": {},
                "pipeline": None,
                "config": None,
                "params": {},
            },
            "command_name": "run",
            "command_path": "kedro run",
        },
    }
    run_1 = RunModel(id="1534326", blob=json.dumps(session_data_1))
    session_data_2 = {
        "package_name": "my_package",
        "project_path": "/Users/Projects/my_package",
        "session_id": "2020-11-17T15.02.12.672Z",
        "cli": {
            "args": [],
            "params": {
                "from_inputs": [],
                "to_outputs": [],
                "from_nodes": [],
                "to_nodes": [],
                "node_names": (),
                "runner": None,
                "parallel": False,
                "is_async": False,
                "env": None,
                "tag": (),
                "load_version": {},
                "pipeline": None,
                "config": None,
                "params": {},
            },
            "command_name": "run",
            "command_path": "kedro run",
        },
    }
    run_2 = RunModel(id="41312339", blob=json.dumps(session_data_2))
    session.add(run_1)
    session.add(run_2)
    session.commit()
    yield session
