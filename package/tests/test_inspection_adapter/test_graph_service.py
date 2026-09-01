"""Tests for the project-scoped inspection graph service."""

from __future__ import annotations

from contextlib import contextmanager
from pathlib import Path

import pytest

from kedro_viz.api.rest.responses.pipelines import GraphAPIResponse
from kedro_viz.integrations.kedro.inspection import (
    EnrichmentSources,
    InspectionGraphService,
    PipelineNotFoundError,
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


def test_project_options_and_parameters_reach_the_builder(mocker) -> None:
    """Snapshot configuration and resolved parameters come from the same session."""
    runtime_params = {"split_options": {"test_size": 0.3}}
    session_class = mocker.patch(
        "kedro_viz.integrations.kedro.inspection.graph_service._InspectionSession"
    )
    session = session_class.return_value
    graph_builder = mocker.patch(
        "kedro_viz.integrations.kedro.inspection.graph_service.GraphBuilder"
    )

    InspectionGraphService.from_project(
        DEMO_PROJECT,
        env="staging",
        runtime_params=runtime_params,
    )

    session_class.assert_called_once_with(
        DEMO_PROJECT,
        env="staging",
        runtime_params=runtime_params,
    )
    graph_builder.assert_called_once_with(
        session.snapshot.return_value,
        session.catalog_config.return_value,
        parameters=session.parameters.return_value,
        layer_by_dataset=None,
    )


def test_populated_catalog_layers_reach_the_builder(mocker) -> None:
    """The post-hook catalog mapping is authoritative for rendered layers."""
    session = mocker.patch(
        "kedro_viz.integrations.kedro.inspection.graph_service._InspectionSession"
    ).return_value
    graph_builder = mocker.patch(
        "kedro_viz.integrations.kedro.inspection.graph_service.GraphBuilder"
    )
    enrichment = EnrichmentSources(layer_by_dataset={"companies": "hooked"})

    InspectionGraphService.from_project(DEMO_PROJECT, enrichment=enrichment)

    graph_builder.assert_called_once_with(
        session.snapshot.return_value,
        session.catalog_config.return_value,
        parameters=session.parameters.return_value,
        layer_by_dataset={"companies": "hooked"},
    )


def test_lite_service_reads_project_data_inside_import_stubs(mocker) -> None:
    """Project imports stay mocked until snapshot, catalog and parameters are read."""
    events: list[object] = []

    @contextmanager
    def import_stubs(project_path, package_name):
        events.append(("enter", project_path, package_name))
        yield
        events.append(("exit", project_path, package_name))

    session = mocker.patch(
        "kedro_viz.integrations.kedro.inspection.graph_service._InspectionSession"
    ).return_value

    def read_snapshot():
        events.append("snapshot")
        return object()

    def read_catalog():
        events.append("catalog")
        return {}

    def read_parameters():
        events.append("parameters")
        return {}

    session.snapshot.side_effect = read_snapshot
    session.catalog_config.side_effect = read_catalog
    session.parameters.side_effect = read_parameters
    mocker.patch("kedro_viz.integrations.kedro.inspection.graph_service.GraphBuilder")
    stubs = mocker.patch(
        "kedro_viz.integrations.kedro.inspection.graph_service.lite_import_stubs",
        side_effect=import_stubs,
    )

    InspectionGraphService.from_project(
        DEMO_PROJECT,
        package_name="spaceflights",
        is_lite=True,
    )

    stubs.assert_called_once_with(DEMO_PROJECT, "spaceflights")
    assert events == [
        ("enter", DEMO_PROJECT, "spaceflights"),
        "snapshot",
        "catalog",
        "parameters",
        ("exit", DEMO_PROJECT, "spaceflights"),
    ]


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
