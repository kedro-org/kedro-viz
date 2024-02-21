from pathlib import Path
from typing import Dict
from unittest import mock

import pandas as pd
import pytest
from fastapi.testclient import TestClient
from kedro.framework.session.store import BaseSessionStore
from kedro.io import DataCatalog, MemoryDataset, Version
from kedro.pipeline import Pipeline, node
from kedro.pipeline.modular_pipeline import pipeline
from kedro_datasets import pandas, tracking
from kedro_datasets.pandas import CSVDataset
from pydantic import BaseModel

from kedro_viz.api import apps
from kedro_viz.data_access import DataAccessManager
from kedro_viz.integrations.kedro.hooks import DatasetStatsHook
from kedro_viz.integrations.kedro.sqlite_store import SQLiteStore
from kedro_viz.models.flowchart import GraphNode
from kedro_viz.server import populate_data


@pytest.fixture
def data_access_manager():
    yield DataAccessManager()


@pytest.fixture
def session_store():
    yield BaseSessionStore("dummy_path", "dummy_session_id")


@pytest.fixture
def sqlite_session_store(tmp_path):
    yield SQLiteStore(tmp_path, "dummy_session_id")


@pytest.fixture
def example_stats_dict():
    yield {
        "companies": {"rows": 77096, "columns": 5},
        "reviews": {"rows": 77096, "columns": 10},
        "shuttles": {"rows": 77096, "columns": 13},
        "model_inputs": {"rows": 29768, "columns": 12},
    }


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
        datasets={
            "uk.data_processing.raw_data": pandas.CSVDataset(
                filepath="raw_data.csv", metadata={"kedro-viz": {"layer": "raw"}}
            ),
            "model_inputs": pandas.CSVDataset(
                filepath="model_inputs.csv",
                metadata={"kedro-viz": {"layer": "model_inputs"}},
            ),
            "uk.data_science.model": MemoryDataset(),
        },
        feed_dict={
            "parameters": {"train_test_split": 0.1, "num_epochs": 1000},
            "params:uk.data_processing.train_test_split": 0.1,
        },
        dataset_patterns={
            "{dataset_name}#csv": {
                "type": "pandas.CSVDataset",
                "filepath": "data/01_raw/{dataset_name}#csv.csv",
            },
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
        datasets={
            "model_inputs@pandas": pandas.ParquetDataset(
                filepath="model_inputs.parquet"
            ),
            "model_inputs@pandas2": pandas.CSVDataset(filepath="model_inputs.csv"),
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
    session_store: BaseSessionStore,
    example_stats_dict: Dict,
    mocker,
):
    api = apps.create_api_app_from_project(mock.MagicMock())
    populate_data(
        data_access_manager,
        example_catalog,
        example_pipelines,
        session_store,
        example_stats_dict,
    )
    mocker.patch(
        "kedro_viz.api.rest.responses.data_access_manager", new=data_access_manager
    )
    yield api


@pytest.fixture
def example_api_no_default_pipeline(
    data_access_manager: DataAccessManager,
    example_pipelines: Dict[str, Pipeline],
    example_catalog: DataCatalog,
    session_store: BaseSessionStore,
    mocker,
):
    del example_pipelines["__default__"]
    api = apps.create_api_app_from_project(mock.MagicMock())
    populate_data(
        data_access_manager, example_catalog, example_pipelines, session_store, {}
    )
    mocker.patch(
        "kedro_viz.api.rest.responses.data_access_manager", new=data_access_manager
    )
    yield api


@pytest.fixture
def example_transcoded_api(
    data_access_manager: DataAccessManager,
    example_transcoded_pipelines: Dict[str, Pipeline],
    example_transcoded_catalog: DataCatalog,
    session_store: BaseSessionStore,
    mocker,
):
    api = apps.create_api_app_from_project(mock.MagicMock())
    populate_data(
        data_access_manager,
        example_transcoded_catalog,
        example_transcoded_pipelines,
        session_store,
        {},
    )
    mocker.patch(
        "kedro_viz.api.rest.responses.data_access_manager", new=data_access_manager
    )
    yield api


@pytest.fixture
def example_run_ids():
    yield ["2021-11-03T18.24.24.379Z", "2021-11-02T18.24.24.379Z"]


@pytest.fixture
def example_multiple_run_tracking_dataset(example_run_ids, tmp_path):
    new_metrics_dataset = tracking.MetricsDataset(
        filepath=Path(tmp_path / "test.json").as_posix(),
        version=Version(None, example_run_ids[1]),
    )
    new_metrics_dataset.save({"col1": 1, "col3": 3})
    new_metrics_dataset = tracking.MetricsDataset(
        filepath=Path(tmp_path / "test.json").as_posix(),
        version=Version(None, example_run_ids[0]),
    )
    new_data = {"col1": 3, "col2": 3.23}
    new_metrics_dataset.save(new_data)

    yield new_metrics_dataset


@pytest.fixture
def client(example_api):
    yield TestClient(example_api)


@pytest.fixture
def mock_http_response():
    class MockHTTPResponse(BaseModel, frozen=True):
        data: dict

        def model_dump_json(self, **kwargs):
            return self.data

    return MockHTTPResponse


@pytest.fixture
def example_data_frame():
    data = {
        "id": ["35029", "30292", "12345", "67890", "54321", "98765", "11111"],
        "company_rating": ["100%", "67%", "80%", "95%", "72%", "88%", "75%"],
        "company_location": [
            "Niue",
            "Anguilla",
            "Barbados",
            "Fiji",
            "Grenada",
            "Jamaica",
            "Trinidad and Tobago",
        ],
    }
    yield pd.DataFrame(data)


@pytest.fixture
def example_dataset_stats_hook_obj():
    # Create an instance of DatasetStatsHook
    yield DatasetStatsHook()


@pytest.fixture
def example_csv_dataset(tmp_path, example_data_frame):
    new_csv_dataset = pandas.CSVDataset(
        filepath=Path(tmp_path / "model_inputs.csv").as_posix(),
    )
    new_csv_dataset.save(example_data_frame)
    yield new_csv_dataset


@pytest.fixture
def example_csv_filepath(tmp_path, example_data_frame):
    csv_file_path = tmp_path / "temporary_test_data.csv"
    example_data_frame.to_csv(csv_file_path, index=False)
    yield csv_file_path


@pytest.fixture
def example_data_node(example_csv_filepath):
    dataset_name = "uk.data_science.model_training.dataset"
    metadata = {"kedro-viz": {"preview_args": {"nrows": 3}}}
    kedro_dataset = CSVDataset(filepath=example_csv_filepath, metadata=metadata)
    data_node = GraphNode.create_data_node(
        dataset_name=dataset_name,
        layer="raw",
        tags=set(),
        dataset=kedro_dataset,
        stats={"rows": 10, "columns": 5, "file_size": 1024},
    )

    yield data_node


@pytest.fixture
def example_data_node_without_viz_metadata(example_csv_filepath):
    dataset_name = "uk.data_science.model_training.dataset"
    kedro_dataset = CSVDataset(filepath=example_csv_filepath)
    data_node = GraphNode.create_data_node(
        dataset_name=dataset_name,
        layer="raw",
        tags=set(),
        dataset=kedro_dataset,
        stats={"rows": 10, "columns": 5, "file_size": 1024},
    )

    yield data_node


# Create a mock for KedroPipeline with datasets method
@pytest.fixture
def pipeline_with_datasets_mock():
    pipeline = mock.MagicMock()
    pipeline.datasets.return_value = ["model_inputs#csv"]
    return pipeline


# Create a mock for KedroPipeline with data_sets method
# older versions
@pytest.fixture
def pipeline_with_data_sets_mock():
    pipeline = mock.MagicMock()
    pipeline.data_sets.return_value = ["model_inputs#csv"]
    return pipeline
