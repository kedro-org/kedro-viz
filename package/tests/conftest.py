from dataclasses import dataclass
from typing import Dict
from unittest import mock

import pytest
from fastapi.testclient import TestClient
from kedro.extras.datasets.pandas import CSVDataSet, ParquetDataSet
from kedro.io import DataCatalog, MemoryDataSet
from kedro.pipeline import Pipeline, node
from kedro.pipeline.modular_pipeline import pipeline

from kedro_viz.api import apps
from kedro_viz.data_access import DataAccessManager
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
        [
            node(
                process_data,
                inputs=["raw_data", "params:train_test_split"],
                outputs="model_inputs",
                name="process_data",
                tags=["split"],
            )
        ],
        namespace="uk.data_processing",
        outputs="model_inputs",
    )
    data_science_pipeline = pipeline(
        [
            node(
                train_model,
                inputs=["model_inputs", "parameters"],
                outputs="model",
                name="train_model",
                tags=["train"],
            )
        ],
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
            "params:uk.data_processing.train_test_split": 0.1,
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
        [
            node(
                process_data,
                inputs=["raw_data", "params:uk.data_processing.train_test_split"],
                outputs="model_inputs@pandas2",
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
            "model_inputs@pandas2": CSVDataSet(filepath="model_inputs.csv"),
        },
        feed_dict={
            "parameters": {"train_test_split": 0.1, "num_epochs": 1000},
            "params:uk.data_processing.train_test_split": 0.1,
        },
    )


@pytest.fixture
def example_api(
    data_access_manager: DataAccessManager,
    example_pipelines: Dict[str, Pipeline],
    example_catalog: DataCatalog,
    mocker,
):
    api = apps.create_api_app_from_project(mock.MagicMock())
    populate_data(data_access_manager, example_catalog, example_pipelines, None)
    mocker.patch("kedro_viz.api.responses.data_access_manager", new=data_access_manager)
    mocker.patch("kedro_viz.api.router.data_access_manager", new=data_access_manager)
    yield api


@pytest.fixture
def example_api_no_default_pipeline(
    data_access_manager: DataAccessManager,
    example_pipelines: Dict[str, Pipeline],
    example_catalog: DataCatalog,
    mocker,
):
    del example_pipelines["__default__"]
    api = apps.create_api_app_from_project(mock.MagicMock())
    populate_data(data_access_manager, example_catalog, example_pipelines, None)
    mocker.patch("kedro_viz.api.responses.data_access_manager", new=data_access_manager)
    mocker.patch("kedro_viz.api.router.data_access_manager", new=data_access_manager)
    yield api


@pytest.fixture
def example_transcoded_api(
    data_access_manager: DataAccessManager,
    example_transcoded_pipelines: Dict[str, Pipeline],
    example_transcoded_catalog: DataCatalog,
    mocker,
):
    api = apps.create_api_app_from_project(mock.MagicMock())
    populate_data(
        data_access_manager,
        example_transcoded_catalog,
        example_transcoded_pipelines,
        None,
    )
    mocker.patch("kedro_viz.api.responses.data_access_manager", new=data_access_manager)
    mocker.patch("kedro_viz.api.router.data_access_manager", new=data_access_manager)
    yield api


@pytest.fixture
def client(example_api):
    yield TestClient(example_api)


@pytest.fixture
def mock_http_response():
    @dataclass(frozen=True)
    class MockHTTPResponse:
        data: dict

        def json(self):
            return self.data

    return MockHTTPResponse
