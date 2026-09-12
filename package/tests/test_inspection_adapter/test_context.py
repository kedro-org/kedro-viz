"""Tests for constructing project-scoped inspection services from shared inputs."""

from pathlib import Path

import pytest

from kedro_viz.api.rest.responses.pipelines import TaskNodeAPIResponse
from kedro_viz.integrations.kedro.inspection import (
    EnrichmentSources,
    PipelineNotFoundError,
    VizProjectContext,
)
from kedro_viz.integrations.kedro.inspection import context as context_module
from kedro_viz.integrations.kedro.inspection.enrichment import GraphExtras
from kedro_viz.integrations.kedro.inspection.graph_service import GraphService
from kedro_viz.integrations.kedro.inspection.node_metadata_service import (
    NodeMetadataService,
)
from kedro_viz.models.metadata import NodeExtras

PROJECT = Path("/some/project")
DEMO_PROJECT = Path(__file__).resolve().parents[3] / "demo-project"


def test_context_builds_graph_from_the_loaded_inputs(mocker) -> None:
    """The context, rather than an individual service, owns the project read."""
    inputs = mocker.sentinel.inputs
    load_inputs = mocker.patch(
        "kedro_viz.integrations.kedro.inspection.context.load_inspection_inputs",
        return_value=inputs,
    )
    graph = mocker.sentinel.graph
    from_inspection_inputs = mocker.patch.object(
        GraphService,
        "from_inspection_inputs",
        return_value=graph,
    )
    nodes = mocker.sentinel.nodes
    prepare_nodes = mocker.patch.object(
        NodeMetadataService, "from_inspection_inputs", return_value=nodes
    )
    node_extras = {"data": NodeExtras(stats={"rows": 3})}
    load_extras = mocker.patch.object(context_module, "load_enrichment_sources")
    enrichment = EnrichmentSources(node_extras_by_name=node_extras)
    run_status = mocker.sentinel.run_status
    prepare_run_status = mocker.patch.object(
        context_module, "RunStatusService", return_value=run_status
    )
    live_nodes = {"task-id": mocker.sentinel.live_node}
    runtime_params = {"split": 0.3}

    context = VizProjectContext.from_project(
        PROJECT,
        env="staging",
        runtime_params=runtime_params,
        package_name="spaceflights",
        is_lite=True,
        enrichment=enrichment,
        live_nodes_by_id=live_nodes,
    )

    load_inputs.assert_called_once_with(
        PROJECT,
        env="staging",
        runtime_params=runtime_params,
        package_name="spaceflights",
        is_lite=True,
    )
    from_inspection_inputs.assert_called_once_with(
        inputs,
        enrichment=enrichment.graph_extras,
    )
    assert context.graph is graph
    prepare_nodes.assert_called_once_with(
        inputs, enrichment=node_extras, live_nodes_by_id=live_nodes
    )
    load_extras.assert_not_called()
    assert context.nodes is nodes
    prepare_run_status.assert_called_once_with(PROJECT)
    assert context.run_status is run_status


def test_context_filters_shared_inputs_before_building_services(mocker) -> None:
    """A pipeline restriction is applied once at the context boundary."""
    inputs = mocker.sentinel.inputs
    filtered_inputs = mocker.sentinel.filtered_inputs
    prepare_nodes = mocker.patch.object(NodeMetadataService, "from_inspection_inputs")
    mocker.patch(
        "kedro_viz.integrations.kedro.inspection.context.load_inspection_inputs",
        return_value=inputs,
    )
    filter_inputs = mocker.patch(
        "kedro_viz.integrations.kedro.inspection.context.filter_inspection_inputs",
        return_value=filtered_inputs,
    )
    from_inspection_inputs = mocker.patch.object(
        GraphService,
        "from_inspection_inputs",
    )

    VizProjectContext.from_project(
        PROJECT, pipeline_name="data_science", enrichment=EnrichmentSources()
    )

    filter_inputs.assert_called_once_with(inputs, "data_science")
    from_inspection_inputs.assert_called_once_with(
        filtered_inputs, enrichment=GraphExtras()
    )
    prepare_nodes.assert_called_once_with(
        filtered_inputs, enrichment={}, live_nodes_by_id=None
    )


@pytest.mark.parametrize("pipeline_name", ["unknown", ""])
def test_unknown_pipeline_is_rejected_before_service_construction(
    mocker, _restore_kedro_project_state, pipeline_name
) -> None:
    prepare = mocker.patch.object(GraphService, "from_inspection_inputs")
    prepare_nodes = mocker.patch.object(NodeMetadataService, "from_inspection_inputs")
    load_extras = mocker.patch.object(context_module, "load_enrichment_sources")

    with pytest.raises(PipelineNotFoundError, match="not found in snapshot"):
        VizProjectContext.from_project(DEMO_PROJECT, pipeline_name=pipeline_name)

    prepare.assert_not_called()
    prepare_nodes.assert_not_called()
    load_extras.assert_not_called()


def test_context_reuses_loaded_inputs_across_requests(
    mocker, _restore_kedro_project_state
) -> None:
    load = mocker.spy(context_module, "load_inspection_inputs")
    filter_inputs = mocker.spy(context_module, "filter_inspection_inputs")
    prepare = mocker.spy(GraphService, "from_inspection_inputs")
    prepare_nodes = mocker.spy(NodeMetadataService, "from_inspection_inputs")
    load_extras = mocker.spy(context_module, "load_enrichment_sources")

    context = VizProjectContext.from_project(
        DEMO_PROJECT, pipeline_name="data_ingestion"
    )
    first = context.graph.get_pipeline_response()
    second = context.graph.get_pipeline_response("data_ingestion")
    task_id = next(node.id for node in first.nodes if node.type == "task")
    first_metadata = context.nodes.get_node_metadata_response(task_id)
    second_metadata = context.nodes.get_node_metadata_response(task_id)

    load.assert_called_once()
    filter_inputs.assert_called_once()
    prepare.assert_called_once()
    prepare_nodes.assert_called_once()
    load_extras.assert_called_once()
    assert prepare.call_args.args[0] is prepare_nodes.call_args.args[0]
    assert first == second
    assert first is not second
    assert first_metadata == second_metadata
    assert first_metadata is not second_metadata


@pytest.mark.parametrize("node_extras", [{}, {"data": NodeExtras(stats={"rows": 3})}])
def test_context_reuses_explicit_node_extras(mocker, node_extras) -> None:
    inputs = mocker.sentinel.inputs
    mocker.patch.object(context_module, "load_inspection_inputs", return_value=inputs)
    mocker.patch.object(GraphService, "from_inspection_inputs")
    prepare_nodes = mocker.patch.object(NodeMetadataService, "from_inspection_inputs")
    load_extras = mocker.patch.object(context_module, "load_enrichment_sources")

    VizProjectContext.from_project(
        PROJECT, enrichment=EnrichmentSources(node_extras_by_name=node_extras)
    )

    load_extras.assert_not_called()
    prepare_nodes.assert_called_once_with(
        inputs, enrichment=node_extras, live_nodes_by_id=None
    )


def test_context_preserves_unvalidated_parameter_values(
    mocker, _restore_kedro_project_state
) -> None:
    """Inspection must not add pipeline-annotation validation during context loading."""
    validate = mocker.patch(
        "kedro.validation.parameter_validator.ParameterValidator.validate_raw_params",
        side_effect=AssertionError("Inspection must not validate parameters"),
    )
    context = VizProjectContext.from_project(
        DEMO_PROJECT,
        runtime_params={"split_options": {"test_size": "not-a-number"}},
    )

    response = context.graph.get_pipeline_response()

    validate.assert_not_called()
    split_nodes = [
        node
        for node in response.nodes
        if isinstance(node, TaskNodeAPIResponse) and node.name.startswith("split_data")
    ]
    assert split_nodes
    assert split_nodes[0].parameters["split_options"]["test_size"] == "not-a-number"
