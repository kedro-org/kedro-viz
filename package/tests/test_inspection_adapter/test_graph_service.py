"""Tests for the project-scoped inspection graph service."""

from __future__ import annotations

from pathlib import Path

import pytest

from kedro_viz.api.rest.responses.pipelines import GraphAPIResponse
from kedro_viz.integrations.kedro.inspection import (
    PipelineNotFoundError,
)
from kedro_viz.integrations.kedro.inspection.enrichment import GraphExtras
from kedro_viz.integrations.kedro.inspection.graph_service import GraphService
from kedro_viz.integrations.kedro.inspection.snapshot_source import (
    InspectionInputs,
    filter_inspection_inputs,
    load_inspection_inputs,
)

DEMO_PROJECT = Path(__file__).resolve().parents[3] / "demo-project"


@pytest.fixture(scope="module")
def graph_service(_restore_kedro_project_state) -> GraphService:
    """Build the demo snapshot once for the service response tests."""
    return GraphService.from_inspection_inputs(load_inspection_inputs(DEMO_PROJECT))


def test_default_pipeline_is_served_when_none_is_requested(graph_service) -> None:
    response = graph_service.get_pipeline_response()
    assert response.selected_pipeline == "__default__"


def test_named_pipeline_is_served(graph_service) -> None:
    response = graph_service.get_pipeline_response("data_ingestion")
    assert response.selected_pipeline == "data_ingestion"


@pytest.mark.parametrize("pipeline_id", ["does_not_exist", ""])
def test_unknown_pipeline_is_rejected(graph_service, pipeline_id: str) -> None:
    """The HTTP route translates the service's domain error into a 404."""
    with pytest.raises(PipelineNotFoundError, match="Invalid pipeline ID"):
        graph_service.get_pipeline_response(pipeline_id)


def test_pipeline_list_preserves_declaration_order(graph_service) -> None:
    """Declaration order drives the pipeline dropdown, so the whole list must match."""
    response = graph_service.get_pipeline_response()
    assert [pipeline.id for pipeline in response.pipelines] == [
        "__default__",
        "data_ingestion",
        "modelling_stage",
        "feature_engineering",
        "reporting_stage",
        "pre_modelling",
    ]


def test_pipeline_filter_hides_every_other_pipeline(
    _restore_kedro_project_state,
) -> None:
    """``--pipeline`` narrows the snapshot to that pipeline alone."""
    inputs = filter_inspection_inputs(
        load_inspection_inputs(DEMO_PROJECT),
        "data_ingestion",
    )
    service = GraphService.from_inspection_inputs(inputs)

    response = service.get_pipeline_response()
    assert [pipeline.id for pipeline in response.pipelines] == ["data_ingestion"]
    with pytest.raises(PipelineNotFoundError, match="Invalid pipeline ID"):
        service.get_pipeline_response("reporting_stage")


def test_inputs_reaches_the_builder(mocker) -> None:
    """Graph construction consumes the already-loaded snapshot and config."""
    inputs = mocker.Mock(
        spec=InspectionInputs,
        snapshot=mocker.sentinel.snapshot,
        catalog_config={"companies": {}},
        parameters={"split": 0.2},
    )
    graph_builder = mocker.patch(
        "kedro_viz.integrations.kedro.inspection.graph_service.GraphBuilder"
    )

    GraphService.from_inspection_inputs(inputs)

    graph_builder.assert_called_once_with(
        mocker.sentinel.snapshot,
        {"companies": {}},
        parameters={"split": 0.2},
        layer_by_dataset_name=None,
        node_extras_by_name=None,
    )


def test_populated_catalog_layers_reach_the_builder(mocker) -> None:
    """The post-hook catalog mapping is authoritative for rendered layers."""
    graph_builder = mocker.patch(
        "kedro_viz.integrations.kedro.inspection.graph_service.GraphBuilder"
    )
    graph_extras = GraphExtras(layer_by_dataset_name={"companies": "hooked"})
    inputs = mocker.Mock(
        spec=InspectionInputs,
        snapshot=mocker.sentinel.snapshot,
        catalog_config={},
        parameters={},
    )

    GraphService.from_inspection_inputs(inputs, graph_extras=graph_extras)

    graph_builder.assert_called_once_with(
        mocker.sentinel.snapshot,
        {},
        parameters={},
        layer_by_dataset_name={"companies": "hooked"},
        node_extras_by_name=None,
    )


def test_file_backed_node_extras_reach_the_builder(mocker) -> None:
    """Stats/styles read at the context boundary are threaded straight to the builder."""
    graph_builder = mocker.patch(
        "kedro_viz.integrations.kedro.inspection.graph_service.GraphBuilder"
    )
    inputs = mocker.Mock(
        spec=InspectionInputs,
        snapshot=mocker.sentinel.snapshot,
        catalog_config={},
        parameters={},
    )
    node_extras_by_name = {"companies": mocker.sentinel.extras}

    GraphService.from_inspection_inputs(inputs, node_extras_by_name=node_extras_by_name)

    graph_builder.assert_called_once_with(
        mocker.sentinel.snapshot,
        {},
        parameters={},
        layer_by_dataset_name=None,
        node_extras_by_name=node_extras_by_name,
    )


def test_service_returns_the_built_response_unchanged(mocker) -> None:
    """The service has no post-build enrichment step; the builder's response is final."""
    builder = mocker.Mock()
    builder.default_pipeline_id.return_value = "__default__"
    builder.has_pipeline.return_value = True
    response = GraphAPIResponse(
        nodes=[],
        edges=[],
        layers=[],
        tags=[],
        pipelines=[],
        modular_pipelines={},
        selected_pipeline="__default__",
    )
    builder.build.return_value = response
    service = GraphService(builder)

    assert service.get_pipeline_response() is response
    builder.build.assert_called_once_with("__default__")
