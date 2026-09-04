"""Tests for constructing project-scoped inspection services from shared inputs."""

from pathlib import Path

from kedro_viz.integrations.kedro.inspection import (
    EnrichmentSources,
    InspectionGraphService,
    NodeMetadataService,
    VizProjectContext,
)

PROJECT = Path("/some/project")


def test_context_builds_graph_from_the_loaded_project_data(mocker) -> None:
    """The context, rather than an individual service, owns the project read."""
    project_data = mocker.Mock(
        snapshot=mocker.sentinel.snapshot,
        parameter_feed=mocker.sentinel.parameter_feed,
    )
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
    node_extras = mocker.sentinel.node_extras
    load_node_extras = mocker.patch(
        "kedro_viz.integrations.kedro.inspection.context.load_node_extras",
        return_value=node_extras,
    )
    node_metadata = mocker.sentinel.node_metadata
    metadata_service = mocker.patch(
        "kedro_viz.integrations.kedro.inspection.context.NodeMetadataService",
        return_value=node_metadata,
    )
    run_status = mocker.sentinel.run_status
    run_status_service = mocker.patch(
        "kedro_viz.integrations.kedro.inspection.context.RunStatusService",
        return_value=run_status,
    )
    enrichment = EnrichmentSources()
    runtime_params = {"split": 0.3}
    live_nodes = {"task-id": mocker.sentinel.live_node}

    context = VizProjectContext.from_project(
        PROJECT,
        env="staging",
        runtime_params=runtime_params,
        package_name="spaceflights",
        is_lite=True,
        enrichment=enrichment,
        live_nodes_by_id=live_nodes,
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
    load_node_extras.assert_called_once_with(PROJECT)
    metadata_service.assert_called_once_with(
        mocker.sentinel.snapshot,
        parameter_feed=mocker.sentinel.parameter_feed,
        node_extras_by_name=node_extras,
        live_nodes_by_id=live_nodes,
    )
    run_status_service.assert_called_once_with(PROJECT)
    assert context.graph is graph
    assert context.node_metadata is node_metadata
    assert context.run_status is run_status


def test_context_filters_shared_project_data_before_building_services(mocker) -> None:
    """A pipeline restriction is applied once at the context boundary."""
    project_data = mocker.sentinel.project_data
    filtered_data = mocker.Mock(
        snapshot=mocker.sentinel.filtered_snapshot,
        parameter_feed=mocker.sentinel.filtered_parameter_feed,
    )
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
    metadata_service = mocker.patch(
        "kedro_viz.integrations.kedro.inspection.context.NodeMetadataService"
    )
    node_extras: dict = {}

    VizProjectContext.from_project(
        PROJECT,
        pipeline_name="data_science",
        node_extras_by_name=node_extras,
    )

    filter_project_data.assert_called_once_with(project_data, "data_science")
    from_project_data.assert_called_once_with(filtered_data, enrichment=None)
    metadata_service.assert_called_once_with(
        mocker.sentinel.filtered_snapshot,
        parameter_feed=mocker.sentinel.filtered_parameter_feed,
        node_extras_by_name=node_extras,
        live_nodes_by_id=None,
    )


def test_context_uses_explicit_node_extras_without_reading_files(mocker) -> None:
    """The server can reuse extras already read by the transitional live load."""
    project_data = mocker.Mock(
        snapshot=mocker.sentinel.snapshot,
        parameter_feed={"parameters": {}},
    )
    mocker.patch(
        "kedro_viz.integrations.kedro.inspection.context.load_inspection_project_data",
        return_value=project_data,
    )
    mocker.patch.object(InspectionGraphService, "from_project_data")
    load_node_extras = mocker.patch(
        "kedro_viz.integrations.kedro.inspection.context.load_node_extras"
    )
    metadata_service = mocker.patch(
        "kedro_viz.integrations.kedro.inspection.context.NodeMetadataService",
        spec=NodeMetadataService,
    )
    node_extras = {"companies": mocker.sentinel.extras}

    VizProjectContext.from_project(
        PROJECT,
        node_extras_by_name=node_extras,
    )

    load_node_extras.assert_not_called()
    metadata_service.assert_called_once_with(
        mocker.sentinel.snapshot,
        parameter_feed={"parameters": {}},
        node_extras_by_name=node_extras,
        live_nodes_by_id=None,
    )
