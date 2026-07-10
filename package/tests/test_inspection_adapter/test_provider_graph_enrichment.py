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


def _graph(
    task_id: str, data_id: str, dataset_type: str | None = None
) -> GraphAPIResponse:
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
                dataset_type=dataset_type,
            ),
        ],
        edges=[],
        layers=[],
        tags=[],
        pipelines=[],
        modular_pipelines={},
        selected_pipeline="__default__",
    )


def test_full_mode_enriches_node_extras() -> None:
    # Task ``parameters`` are no longer overlaid from the bridge — they come from the
    # config-loader values via the builder (see test_runtime_params). The bridge only overlays
    # node_extras here (dataset_type is covered separately).
    kn = kedro_node(
        func=lambda threshold: threshold,
        inputs=["params:threshold"],
        outputs="result",
        name="my_node",
    )
    task_id = node_ids._create_task_node_id(kn.name, list(kn.inputs), list(kn.outputs))
    data_id = node_ids._create_dataset_node_id("companies")
    live_task = TaskNode.create_task_node(
        node=kn,
        node_id="legacy-task-id",
        modular_pipelines=set(),
        node_extras=NodeExtras(styles={"background": "#abc123"}),
    )
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
    assert task_node.node_extras.styles == {"background": "#abc123"}
    assert data_node.node_extras.stats == {"rows": 25}


def test_full_mode_overlays_resolved_dataset_type() -> None:
    """The raw catalog string from the snapshot is replaced by the live resolved class path."""
    from kedro.io import MemoryDataset

    data_id = node_ids._create_dataset_node_id("companies")
    live_data = DataNode.create_data_node(
        dataset_id="legacy-data-id",
        dataset_name="companies",
        layer=None,
        tags=set(),
        dataset=MemoryDataset(),
        modular_pipelines=set(),
    )
    assert isinstance(live_data, DataNode)  # non-transcoded name → plain DataNode
    assert live_data.dataset_type == "io.memory_dataset.MemoryDataset"
    response = _graph("task-id", data_id, dataset_type="pandas.CSVDataset")

    _provider_with_bridge({data_id: live_data})._enrich_graph_with_bridge(response)

    data_node = next(node for node in response.nodes if node.type == "data")
    assert isinstance(data_node, DataNodeAPIResponse)
    assert data_node.dataset_type == "io.memory_dataset.MemoryDataset"


def test_full_mode_sets_transcoded_dataset_type_to_none() -> None:
    """Live serialises transcoded nodes with ``dataset_type=None``; the overlay mirrors that."""
    data_id = node_ids._create_dataset_node_id("companies@pandas")
    live_transcoded = DataNode.create_data_node(
        dataset_id="legacy-data-id",
        dataset_name="companies@pandas",
        layer=None,
        tags=set(),
        dataset=None,
        modular_pipelines=set(),
    )
    assert not isinstance(
        live_transcoded, DataNode
    )  # factory returns TranscodedDataNode
    response = _graph("task-id", data_id, dataset_type="pandas.CSVDataset")

    _provider_with_bridge({data_id: live_transcoded})._enrich_graph_with_bridge(
        response
    )

    data_node = next(node for node in response.nodes if node.type == "data")
    assert isinstance(data_node, DataNodeAPIResponse)
    assert data_node.dataset_type is None


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
