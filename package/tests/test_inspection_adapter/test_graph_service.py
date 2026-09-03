"""Tests for the project-scoped inspection graph service."""

from __future__ import annotations

from pathlib import Path

import pytest

from kedro_viz.api.rest.responses.pipelines import GraphAPIResponse
from kedro_viz.integrations.kedro.inspection import (
    EnrichmentSources,
    InspectionGraphService,
    PipelineNotFoundError,
)
from kedro_viz.integrations.kedro.inspection.snapshot_source import (
    InspectionProjectData,
)

DEMO_PROJECT = Path(__file__).resolve().parents[3] / "demo-project"


@pytest.fixture(scope="module")
def graph_service(_restore_kedro_project_state) -> InspectionGraphService:
    """Build the demo snapshot once for the service response tests."""
    return InspectionGraphService.from_project(DEMO_PROJECT)


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
    service = InspectionGraphService.from_project(
        DEMO_PROJECT, pipeline_name="data_ingestion"
    )

    response = service.get_pipeline_response()
    assert [pipeline.id for pipeline in response.pipelines] == ["data_ingestion"]
    with pytest.raises(PipelineNotFoundError, match="Invalid pipeline ID"):
        service.get_pipeline_response("reporting_stage")


def test_unknown_pipeline_filter_is_rejected_at_startup(
    _restore_kedro_project_state,
) -> None:
    """A bad ``--pipeline`` fails during construction, not on the first request."""
    with pytest.raises(PipelineNotFoundError, match="not found in snapshot"):
        InspectionGraphService.from_project(
            DEMO_PROJECT, pipeline_name="no_such_pipeline"
        )


def test_project_options_reach_the_project_data_loader(mocker) -> None:
    """The compatibility constructor forwards every inspection load option."""
    runtime_params = {"split_options": {"test_size": 0.3}}
    project_data = mocker.sentinel.project_data
    load_project_data = mocker.patch(
        "kedro_viz.integrations.kedro.inspection.graph_service.load_inspection_project_data",
        return_value=project_data,
    )
    service = mocker.sentinel.service
    from_project_data = mocker.patch.object(
        InspectionGraphService,
        "from_project_data",
        return_value=service,
    )

    result = InspectionGraphService.from_project(
        DEMO_PROJECT,
        env="staging",
        runtime_params=runtime_params,
        package_name="spaceflights",
        is_lite=True,
    )

    load_project_data.assert_called_once_with(
        DEMO_PROJECT,
        env="staging",
        runtime_params=runtime_params,
        package_name="spaceflights",
        is_lite=True,
    )
    from_project_data.assert_called_once_with(project_data, enrichment=None)
    assert result is service


def test_project_data_reaches_the_builder(mocker) -> None:
    """Graph construction consumes the already-loaded snapshot and config."""
    project_data = mocker.Mock(
        spec=InspectionProjectData,
        snapshot=mocker.sentinel.snapshot,
        catalog_config={"companies": {}},
        parameter_feed={"parameters": {"split": 0.2}, "params:split": 0.2},
    )
    graph_builder = mocker.patch(
        "kedro_viz.integrations.kedro.inspection.graph_service.GraphBuilder"
    )

    InspectionGraphService.from_project_data(project_data)

    graph_builder.assert_called_once_with(
        mocker.sentinel.snapshot,
        {"companies": {}},
        parameter_feed={"parameters": {"split": 0.2}, "params:split": 0.2},
        layer_by_dataset=None,
    )


def test_populated_catalog_layers_reach_the_builder(mocker) -> None:
    """The post-hook catalog mapping is authoritative for rendered layers."""
    graph_builder = mocker.patch(
        "kedro_viz.integrations.kedro.inspection.graph_service.GraphBuilder"
    )
    enrichment = EnrichmentSources(layer_by_dataset={"companies": "hooked"})
    project_data = mocker.Mock(
        spec=InspectionProjectData,
        snapshot=mocker.sentinel.snapshot,
        catalog_config={},
        parameter_feed={"parameters": {}},
    )

    InspectionGraphService.from_project_data(project_data, enrichment=enrichment)

    graph_builder.assert_called_once_with(
        mocker.sentinel.snapshot,
        {},
        parameter_feed={"parameters": {}},
        layer_by_dataset={"companies": "hooked"},
    )


def test_service_enriches_the_built_response(mocker) -> None:
    """The service applies its prepared enrichment after building each graph."""
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
    enrichment = EnrichmentSources()
    enrich_graph_response = mocker.patch(
        "kedro_viz.integrations.kedro.inspection.graph_service.enrich_graph_response"
    )
    service = InspectionGraphService(builder, enrichment)

    assert service.get_pipeline_response() is response
    builder.build.assert_called_once_with("__default__")
    enrich_graph_response.assert_called_once_with(response, enrichment)
