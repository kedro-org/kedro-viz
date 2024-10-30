import json
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
from kedro_viz.data_access.repositories.modular_pipelines import (
    ModularPipelinesRepository,
)
from kedro_viz.integrations.kedro.hooks import DatasetStatsHook
from kedro_viz.integrations.kedro.sqlite_store import SQLiteStore
from kedro_viz.models.flowchart.node_metadata import DataNodeMetadata
from kedro_viz.models.flowchart.nodes import GraphNode
from kedro_viz.server import populate_data


@pytest.fixture
def setup_kedro_project(tmp_path):
    """Fixture to setup a temporary Kedro project directory structure."""
    kedro_project_path = tmp_path / "kedro_project"
    return kedro_project_path


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
        pass

    def train_model(model_inputs, parameters):
        pass

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
def example_pipeline_with_dataset_as_input_and_output():
    """
    Fixture to mock the use cases mentioned in
    https://github.com/kedro-org/kedro-viz/pull/1651
    """
    # This pipeline contains one namespace and uses
    # analyzed_car_data (dataset) as an output and also as
    # an input to a function of the same namespace
    pipeline_with_dataset_as_input_and_output = pipeline(
        [
            node(
                lambda x: x,
                inputs="raw_car_data",
                outputs="cleaned_car_data",
                name="cleaning_step",
            ),
            node(
                lambda x: x,
                inputs="cleaned_car_data",
                outputs="transformed_car_data",
                name="transformation_step",
            ),
            node(
                lambda x: x,
                inputs="transformed_car_data",
                outputs="analyzed_car_data",
                name="analysis_step",
            ),
            node(
                lambda x: x,
                inputs="analyzed_car_data",
                outputs="final_car_report",
                name="reporting_step",
            ),
        ],
        namespace="main_pipeline",
        inputs=None,
        outputs={"final_car_report", "analyzed_car_data"},
    )

    yield pipeline_with_dataset_as_input_and_output


@pytest.fixture
def example_pipeline_with_dataset_as_input_to_outer_namespace():
    """
    Fixture to mock the use cases mentioned in
    https://github.com/kedro-org/kedro-viz/pull/1651
    """
    # This is a sub pipeline which contains the namespace
    # sub_pipeline and uses validated_customer_data (dataset)
    # from outer namespace
    sub_pipeline = pipeline(
        [
            node(
                lambda x: x,
                inputs="validated_customer_data",
                outputs="enriched_customer_data",
                name="data_enrichment",
            ),
            node(
                lambda x: x,
                inputs="enriched_customer_data",
                outputs="final_customer_data",
                name="data_finalization",
            ),
        ],
        inputs={"validated_customer_data"},
        outputs={"final_customer_data"},
        namespace="sub_pipeline",
    )

    # This is the main pipeline which contains the namespace
    # main_pipeline and uses the ouput of a nested namespace
    # final_customer_data (dataset) as an input
    pipeline_with_dataset_as_input_to_outer_namespace = pipeline(
        [
            node(
                lambda x: x,
                inputs="raw_customer_data",
                outputs="validated_customer_data",
                name="data_validation",
            ),
            sub_pipeline,
            node(
                lambda x: x,
                inputs="validated_customer_data",
                outputs="validated_additional_data",
                name="additional_validation",
            ),
            node(
                lambda x: x,
                inputs="final_customer_data",
                outputs="final_report",
                name="report_generation",
            ),
        ],
        namespace="main_pipeline",
        inputs=None,
        outputs={"final_customer_data", "final_report"},
    )

    yield pipeline_with_dataset_as_input_to_outer_namespace


@pytest.fixture
def example_pipeline_with_node_namespaces():
    """
    Fixture to mock the use cases mentioned in
    https://github.com/kedro-org/kedro-viz/pull/1651
    """
    # This is a pipeline which contains node namespaces
    # and uses prepared_transaction_data (dataset) and
    # analyzed_transaction_data (dataset) as both input
    # and output within the same namespace
    pipeline_with_node_namespaces = pipeline(
        [
            node(
                func=lambda raw_data, cleaned_data: (raw_data, cleaned_data),
                inputs=["raw_transaction_data", "cleaned_transaction_data"],
                outputs="validated_transaction_data",
                name="validation_node",
            ),
            node(
                func=lambda validated_data, enrichment_data: (
                    validated_data,
                    enrichment_data,
                ),
                inputs=["validated_transaction_data", "enrichment_data"],
                outputs="enhanced_transaction_data",
                name="enhancement_node",
            ),
            node(
                func=lambda enhanced_data, aggregated_data: (
                    enhanced_data,
                    aggregated_data,
                ),
                inputs=["enhanced_transaction_data", "aggregated_data"],
                outputs="prepared_transaction_data",
                name="preparation_node",
                namespace="namespace_prefix_1",
            ),
            node(
                func=lambda prepared_data, analysis_data: (
                    prepared_data,
                    analysis_data,
                ),
                inputs=["prepared_transaction_data", "analysis_data"],
                outputs="analyzed_transaction_data",
                name="analysis_node",
                namespace="namespace_prefix_1",
            ),
            node(
                func=lambda analyzed_data, report_data: (analyzed_data, report_data),
                inputs=["analyzed_transaction_data", "report_data"],
                outputs="final_transaction_report",
                name="reporting_node",
                namespace="namespace_prefix_1",
            ),
        ]
    )

    yield pipeline_with_node_namespaces


@pytest.fixture
def example_pipeline_with_dataset_as_input_to_nested_namespace():
    """
    Fixture to mock the use cases mentioned in
    https://github.com/kedro-org/kedro-viz/pull/1651
    """
    # This is a pipeline which contains nested namespaces
    # and uses model_inputs (dataset) which is an output of
    # a nested namespace (uk.data_processing) as an input to
    # another nested namespace (uk.data_science)
    data_processing_pipeline = pipeline(
        [
            node(
                lambda x: x,
                inputs=["raw_data"],
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
                lambda x: x,
                inputs=["model_inputs"],
                outputs="model",
                name="train_model",
                tags=["train"],
            )
        ],
        namespace="uk.data_science",
        inputs="model_inputs",
    )

    yield data_processing_pipeline + data_science_pipeline


@pytest.fixture
def example_nested_namespace_pipeline_with_internal_datasets():
    """
    Fixture to mock the use cases mentioned in
    https://github.com/kedro-org/kedro-viz/issues/1814
    """
    generic_pipe = Pipeline(
        [
            node(
                func=lambda x: x,
                inputs="input_dataset",
                outputs="output_dataset",
                name="generic_processing_node",
            ),
        ]
    )

    internal_pipe = Pipeline(
        [
            pipeline(
                pipe=generic_pipe,
                inputs={"input_dataset": "initial_customer_data"},
                outputs={"output_dataset": "processed_customer_data"},
                namespace="first_processing_step",
            ),
            pipeline(
                pipe=generic_pipe,
                inputs={"input_dataset": "processed_customer_data"},
                outputs={"output_dataset": "final_customer_data_insights"},
                namespace="second_processing_step",
            ),
        ]
    )

    # This is a pipeline which contains nested namespaces
    # with internal datasets (processed_customer_data) that
    # should not be exposed outside of the namespace
    main_pipeline = pipeline(
        pipe=internal_pipe,
        inputs="initial_customer_data",
        outputs="final_customer_data_insights",
        namespace="customer_lifecycle_processing",
    )

    yield main_pipeline


@pytest.fixture
def edge_case_example_pipelines(
    example_pipeline_with_dataset_as_input_and_output,
    example_pipeline_with_dataset_as_input_to_outer_namespace,
    example_pipeline_with_node_namespaces,
    example_pipeline_with_dataset_as_input_to_nested_namespace,
    example_nested_namespace_pipeline_with_internal_datasets,
):
    """
    Fixture to mock the use cases mentioned in
    https://github.com/kedro-org/kedro-viz/pull/1651
    https://github.com/kedro-org/kedro-viz/issues/1814
    """

    yield {
        "__default__": example_pipeline_with_dataset_as_input_and_output
        + example_pipeline_with_dataset_as_input_to_outer_namespace
        + example_pipeline_with_node_namespaces
        + example_pipeline_with_dataset_as_input_to_nested_namespace
        + example_nested_namespace_pipeline_with_internal_datasets,
        "car_pipeline": example_pipeline_with_dataset_as_input_and_output,
        "customer_pipeline": example_pipeline_with_dataset_as_input_to_outer_namespace,
        "transaction_pipeline": example_pipeline_with_node_namespaces,
        "uk_model_pipeline": example_pipeline_with_dataset_as_input_to_nested_namespace,
        "customer_life_cycle_pipeline": example_nested_namespace_pipeline_with_internal_datasets,
    }


@pytest.fixture
def expected_modular_pipeline_tree_for_edge_cases():
    expected_tree_for_edge_cases_file_path = (
        Path(__file__).parent / "test_api/expected_modular_pipeline_tree_for_edge_cases"
    )
    with open(
        expected_tree_for_edge_cases_file_path, encoding="utf-8"
    ) as expected_tree_for_edge_cases:
        return json.load(expected_tree_for_edge_cases)


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
        pass

    def train_model(model_inputs, parameters):
        pass

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
def example_api_for_edge_case_pipelines(
    data_access_manager: DataAccessManager,
    edge_case_example_pipelines: Dict[str, Pipeline],
    example_catalog: DataCatalog,
    session_store: BaseSessionStore,
    mocker,
):
    api = apps.create_api_app_from_project(mock.MagicMock())

    # For readability we are not hashing the node id
    mocker.patch("kedro_viz.utils._hash", side_effect=lambda value: value)
    mocker.patch(
        "kedro_viz.data_access.repositories.modular_pipelines._hash",
        side_effect=lambda value: value,
    )

    populate_data(
        data_access_manager,
        example_catalog,
        edge_case_example_pipelines,
        session_store,
        {},
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
        dataset_id=dataset_name,
        dataset_name=dataset_name,
        layer="raw",
        tags=set(),
        dataset=kedro_dataset,
        stats={"rows": 10, "columns": 5, "file_size": 1024},
        modular_pipelines={"uk", "uk.data_science", "uk.data_science.model_training"},
    )

    yield data_node


@pytest.fixture
def example_data_node_without_viz_metadata(example_csv_filepath):
    dataset_name = "uk.data_science.model_training.dataset"
    kedro_dataset = CSVDataset(filepath=example_csv_filepath)
    data_node = GraphNode.create_data_node(
        dataset_id=dataset_name,
        dataset_name=dataset_name,
        layer="raw",
        tags=set(),
        dataset=kedro_dataset,
        stats={"rows": 10, "columns": 5, "file_size": 1024},
        modular_pipelines={"uk", "uk.data_science", "uk.data_science.model_training"},
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


@pytest.fixture(autouse=True)
def reset_is_all_previews_enabled():
    DataNodeMetadata.is_all_previews_enabled = True


@pytest.fixture
def example_modular_pipelines_repo_obj():
    modular_pipelines_repo_obj = ModularPipelinesRepository()
    yield modular_pipelines_repo_obj
