"""Tests for constructing project-scoped inspection services from shared inputs."""

from pathlib import Path

from kedro_viz.integrations.kedro.inspection import (
    EnrichmentSources,
    InspectionGraphService,
    VizProjectContext,
)

PROJECT = Path("/some/project")


def test_context_builds_graph_from_the_loaded_project_data(mocker) -> None:
    """The context, rather than an individual service, owns the project read."""
    project_data = mocker.sentinel.project_data
    load_project_data = mocker.patch(
        "kedro_viz.integrations.kedro.inspection.context.load_inspection_project_data",
        return_value=project_data,
    )
    graph = mocker.sentinel.graph
    from_project_data = mocker.patch.object(
        InspectionGraphService,
        "from_project_data",
        return_value=graph,
    )
    enrichment = EnrichmentSources()
    runtime_params = {"split": 0.3}

    context = VizProjectContext.from_project(
        PROJECT,
        env="staging",
        runtime_params=runtime_params,
        package_name="spaceflights",
        is_lite=True,
        enrichment=enrichment,
    )

    load_project_data.assert_called_once_with(
        PROJECT,
        env="staging",
        runtime_params=runtime_params,
        package_name="spaceflights",
        is_lite=True,
    )
    from_project_data.assert_called_once_with(
        project_data,
        enrichment=enrichment,
    )
    assert context.graph is graph


def test_context_filters_shared_project_data_before_building_services(mocker) -> None:
    """A pipeline restriction is applied once at the context boundary."""
    project_data = mocker.sentinel.project_data
    filtered_data = mocker.sentinel.filtered_data
    mocker.patch(
        "kedro_viz.integrations.kedro.inspection.context.load_inspection_project_data",
        return_value=project_data,
    )
    filter_project_data = mocker.patch(
        "kedro_viz.integrations.kedro.inspection.context.filter_inspection_project_data",
        return_value=filtered_data,
    )
    from_project_data = mocker.patch.object(
        InspectionGraphService,
        "from_project_data",
    )

    VizProjectContext.from_project(PROJECT, pipeline_name="data_science")

    filter_project_data.assert_called_once_with(project_data, "data_science")
    from_project_data.assert_called_once_with(filtered_data, enrichment=None)
