"""Hermetic tests for provider-level graph enrichment.

The enrichment is deliberately outside ``GraphBuilder``: snapshot graph structure stays pure,
while full mode overlays live-only fields from the metadata bridge.
"""

from kedro.pipeline import node as kedro_node

from kedro_viz.api.inspection_adapter_provider import InspectionAdapterProvider
from kedro_viz.api.rest.responses.pipelines import (
    DataNodeAPIResponse,
    GraphAPIResponse,
    TaskNodeAPIResponse,
)
from kedro_viz.integrations.kedro import node_ids
from kedro_viz.models.flowchart.nodes import DataNode, GraphNode, TaskNode
from kedro_viz.models.metadata import NodeExtras


def _provider_with_bridge(bridge: dict[str, GraphNode]) -> InspectionAdapterProvider:
    provider = InspectionAdapterProvider.__new__(InspectionAdapterProvider)
    provider._metadata_bridge = bridge
    return provider


def _graph(task_id: str, data_id: str) -> GraphAPIResponse:
    return GraphAPIResponse(
        nodes=[
            TaskNodeAPIResponse(
                id=task_id,
                name="my_node",
                full_name="my_node",
                tags=[],
                pipelines=["__default__"],
                type="task",
                modular_pipelines=None,
                parameters={},
            ),
            DataNodeAPIResponse(
                id=data_id,
                name="companies",
                tags=[],
                pipelines=["__default__"],
                type="data",
                modular_pipelines=None,
            ),
        ],
        edges=[],
        layers=[],
        tags=[],
        pipelines=[],
        modular_pipelines={},
        selected_pipeline="__default__",
    )


def test_full_mode_enriches_task_parameters_and_node_extras() -> None:
    kn = kedro_node(
        func=lambda threshold: threshold,
        inputs=["params:threshold"],
        outputs="result",
        name="my_node",
    )
    task_id = node_ids.task_node_id(kn.name, list(kn.inputs), list(kn.outputs))
    data_id = node_ids.dataset_node_id("companies")
    live_task = TaskNode.create_task_node(
        node=kn,
        node_id="legacy-task-id",
        modular_pipelines=set(),
        node_extras=NodeExtras(styles={"background": "#abc123"}),
    )
    live_task.parameters = {"threshold": 0.4}
    live_data = DataNode.create_data_node(
        dataset_id="legacy-data-id",
        dataset_name="companies",
        layer=None,
        tags=set(),
        dataset=None,
        modular_pipelines=set(),
        node_extras=NodeExtras(stats={"rows": 25}),
    )
    response = _graph(task_id, data_id)

    _provider_with_bridge(
        {task_id: live_task, data_id: live_data}
    )._enrich_graph_with_bridge(response)

    task_node = next(node for node in response.nodes if node.type == "task")
    data_node = next(node for node in response.nodes if node.type == "data")
    assert isinstance(task_node, TaskNodeAPIResponse)
    assert isinstance(data_node, DataNodeAPIResponse)
    assert task_node.node_extras is not None
    assert data_node.node_extras is not None
    assert task_node.parameters == {"threshold": 0.4}
    assert task_node.node_extras.styles == {"background": "#abc123"}
    assert data_node.node_extras.stats == {"rows": 25}


def test_lite_mode_graph_enrichment_is_noop_with_empty_bridge() -> None:
    response = _graph(task_id="task-id", data_id="data-id")

    _provider_with_bridge({})._enrich_graph_with_bridge(response)

    task_node = next(node for node in response.nodes if node.type == "task")
    data_node = next(node for node in response.nodes if node.type == "data")
    assert isinstance(task_node, TaskNodeAPIResponse)
    assert isinstance(data_node, DataNodeAPIResponse)
    assert task_node.parameters == {}
    assert task_node.node_extras is None
    assert data_node.node_extras is None
