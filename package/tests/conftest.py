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
from kedro_viz.models.experiments_tracking import Base, RunModel, UserRunDetailsModel
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
def save_version():
    yield "2021-11-02T18.24.24.379Z"


@pytest.fixture
def save_new_version():
    yield "2021-11-03T18.24.24.379Z"


@pytest.fixture
def example_db_dataset(example_db_session, save_version, save_new_version):
    session = example_db_session

    session_data_1 = {
        "package_name": "testsql",
        "project_path": "/Users/Projects/testsql",
        "session_id": save_version,
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
    run_1 = RunModel(id=save_version, blob=json.dumps(session_data_1))
    session_data_2 = {
        "package_name": "my_package",
        "project_path": "/Users/Projects/my_package",
        "session_id": save_new_version,
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
    run_2 = RunModel(id=save_new_version, blob=json.dumps(session_data_2))
    user_run_details = UserRunDetailsModel(run_id=run_1.id)
    session.add(run_1)
    session.add(run_2)
    session.add(user_run_details)
    session.commit()
    yield session
