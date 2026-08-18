"""Tests for ``InspectionAdapterProvider``.

A provider is built against the demo project, so these assert the real response rather than a
stub. The overlay tests inject a node repository instead of loading a project.
"""

from __future__ import annotations

from contextlib import contextmanager
from copy import copy
from pathlib import Path

import pytest
from fastapi.responses import JSONResponse
from kedro.pipeline import node as make_node
from kedro_datasets.pandas import CSVDataset

from kedro_viz.api.inspection_adapter_provider import InspectionAdapterProvider
from kedro_viz.api.rest.responses.pipelines import (
    DataNodeAPIResponse,
    GraphAPIResponse,
    NodeExtrasAPIResponse,
    TaskNodeAPIResponse,
)
from kedro_viz.data_access.repositories.graph import GraphNodesRepository
from kedro_viz.integrations.kedro.node_ids import (
    _create_dataset_node_id,
    _create_task_node_id,
)
from kedro_viz.models.flowchart.nodes import GraphNode, TaskNode, TranscodedDataNode
from kedro_viz.models.metadata import NodeExtras
from kedro_viz.utils import _hash, _hash_input_output

DEMO_PROJECT = Path(__file__).resolve().parents[3] / "demo-project"


@pytest.fixture(scope="module")
def provider(_restore_kedro_project_state) -> InspectionAdapterProvider:
    """Module-scoped: constructing the provider bootstraps Kedro and reads the snapshot once."""
    return InspectionAdapterProvider(
        DEMO_PROJECT,
        live_node_repository=GraphNodesRepository(),
    )


@pytest.fixture
def overlay_provider(provider) -> InspectionAdapterProvider:
    """Isolate live-repository changes while reusing the expensive snapshot builder."""
    return copy(provider)


# Provider responses


def test_default_pipeline_is_served_when_none_is_requested(provider) -> None:
    response = provider.get_pipeline_response()
    assert isinstance(response, GraphAPIResponse)
    assert response.selected_pipeline == "__default__"


def test_named_pipeline_is_served(provider) -> None:
    response = provider.get_pipeline_response("data_ingestion")
    assert isinstance(response, GraphAPIResponse)
    assert response.selected_pipeline == "data_ingestion"


def test_unknown_pipeline_returns_404(provider) -> None:
    response = provider.get_pipeline_response("does_not_exist")
    assert isinstance(response, JSONResponse)
    assert response.status_code == 404


def test_pipeline_list_preserves_declaration_order(provider) -> None:
    """Declaration order drives the pipeline dropdown, so the whole list must match."""
    response = provider.get_pipeline_response()
    assert isinstance(response, GraphAPIResponse)
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
    """``--pipeline`` narrows the snapshot, so only that pipeline is addressable."""
    scoped = InspectionAdapterProvider(DEMO_PROJECT, pipeline_name="data_ingestion")
    response = scoped.get_pipeline_response()
    assert isinstance(response, GraphAPIResponse)
    assert [pipeline.id for pipeline in response.pipelines] == ["data_ingestion"]
    excluded = scoped.get_pipeline_response("reporting_stage")
    assert isinstance(excluded, JSONResponse)
    assert excluded.status_code == 404


def test_unknown_pipeline_filter_is_rejected_at_startup(
    _restore_kedro_project_state,
) -> None:
    """A bad ``--pipeline`` fails when the provider is built, not on the first request."""
    with pytest.raises(ValueError, match="not found in snapshot"):
        InspectionAdapterProvider(DEMO_PROJECT, pipeline_name="no_such_pipeline")


def test_provider_forwards_env_and_runtime_params_to_the_session(mocker) -> None:
    """The session must receive the options that control snapshot and config loading."""
    runtime_params = {"split_options": {"test_size": 0.3}}
    session_class = mocker.patch(
        "kedro_viz.api.inspection_adapter_provider._InspectionSession"
    )
    session = session_class.return_value
    snapshot = session.snapshot.return_value
    catalog_config = session.catalog_config.return_value
    graph_builder = mocker.patch(
        "kedro_viz.api.inspection_adapter_provider.GraphBuilder"
    )

    InspectionAdapterProvider(
        DEMO_PROJECT,
        env="staging",
        runtime_params=runtime_params,
        live_node_repository=GraphNodesRepository(),
    )

    session_class.assert_called_once_with(
        DEMO_PROJECT,
        env="staging",
        runtime_params=runtime_params,
    )
    graph_builder.assert_called_once_with(
        snapshot,
        catalog_config,
        layer_by_dataset=None,
    )


def test_provider_forwards_populated_catalog_layers_to_the_builder(mocker) -> None:
    """The post-hook catalog mapping is authoritative for rendered layers."""
    session = mocker.patch(
        "kedro_viz.api.inspection_adapter_provider._InspectionSession"
    ).return_value
    graph_builder = mocker.patch(
        "kedro_viz.api.inspection_adapter_provider.GraphBuilder"
    )
    layer_by_dataset = {"companies": "hooked"}

    InspectionAdapterProvider(
        DEMO_PROJECT,
        live_node_repository=GraphNodesRepository(),
        layer_by_dataset=layer_by_dataset,
    )

    graph_builder.assert_called_once_with(
        session.snapshot.return_value,
        session.catalog_config.return_value,
        layer_by_dataset=layer_by_dataset,
    )


def test_lite_provider_reads_project_data_inside_import_stubs(mocker) -> None:
    """Snapshot imports must stay mocked until the snapshot and config are materialised."""
    events = []

    @contextmanager
    def import_stubs(project_path, package_name):
        events.append(("enter", project_path, package_name))
        yield
        events.append(("exit", project_path, package_name))

    session = mocker.patch(
        "kedro_viz.api.inspection_adapter_provider._InspectionSession"
    ).return_value

    def read_snapshot():
        events.append("snapshot")
        return object()

    def read_catalog():
        events.append("catalog")
        return {}

    session.snapshot.side_effect = read_snapshot
    session.catalog_config.side_effect = read_catalog
    graph_builder = mocker.patch(
        "kedro_viz.api.inspection_adapter_provider.GraphBuilder"
    )
    stubs = mocker.patch(
        "kedro_viz.api.inspection_adapter_provider.lite_import_stubs",
        side_effect=import_stubs,
    )

    InspectionAdapterProvider(
        DEMO_PROJECT,
        package_name="spaceflights",
        is_lite=True,
    )

    stubs.assert_called_once_with(DEMO_PROJECT, "spaceflights")
    assert events == [
        ("enter", DEMO_PROJECT, "spaceflights"),
        "snapshot",
        "catalog",
        ("exit", DEMO_PROJECT, "spaceflights"),
    ]
    graph_builder.assert_called_once()


# Live-field overlay


def _live_dataset(
    name: str,
    *,
    stats: dict | None = None,
    styles: dict | None = None,
) -> GraphNode:
    extras = (
        NodeExtras(stats=stats, styles=styles)
        if stats is not None or styles is not None
        else None
    )
    return GraphNode.create_data_node(
        dataset_id=_hash_input_output(name),
        dataset_name=name,
        layer=None,
        tags=set(),
        dataset=CSVDataset(filepath="data.csv"),
        modular_pipelines=None,
        node_extras=extras,
    )


def _live_repository(*nodes: GraphNode) -> GraphNodesRepository:
    repository = GraphNodesRepository()
    for node in nodes:
        repository.add_node(node)
    return repository


def _graph_dataset(name: str) -> DataNodeAPIResponse:
    return DataNodeAPIResponse(
        id=_create_dataset_node_id(name),
        name=name,
        tags=[],
        pipelines=["__default__"],
        type="data",
        modular_pipelines=None,
        layer=None,
        dataset_type="pandas.CSVDataset",
    )


def _dummy_func(companies):  # pragma: no cover - only the signature is used
    return companies


def _task_pair(name: str, parameters: dict) -> tuple[TaskNode, TaskNodeAPIResponse]:
    """Build one Kedro node as both a live node and a graph node.

    Each side is keyed by the ID scheme its own production path uses, so this would fail if
    the two schemes drifted apart.
    """
    kedro_node = make_node(
        _dummy_func, inputs="companies", outputs="typed_companies", name=name
    )
    live_node = GraphNode.create_task_node(
        node=kedro_node,
        node_id=_hash(str(kedro_node)),
        modular_pipelines=None,
    )
    live_node.parameters = parameters
    graph_node = TaskNodeAPIResponse(
        id=_create_task_node_id(
            node_name=kedro_node.name,
            func_name=_dummy_func.__name__,
            namespace=None,
            inputs=list(kedro_node.inputs),
            outputs=list(kedro_node.outputs),
        ),
        name=name,
        full_name=kedro_node.name,
        tags=[],
        pipelines=["__default__"],
        type="task",
        modular_pipelines=None,
        parameters={},
    )
    return live_node, graph_node


def _graph_response(*nodes) -> GraphAPIResponse:
    return GraphAPIResponse(
        nodes=list(nodes),
        edges=[],
        layers=[],
        tags=[],
        pipelines=[],
        modular_pipelines={},
        selected_pipeline="__default__",
    )


def test_overlay_sets_the_resolved_dataset_type(overlay_provider, monkeypatch) -> None:
    """The snapshot carries the raw catalog string; the frontend needs the resolved path."""
    graph_node = _graph_dataset("companies")
    response = _graph_response(graph_node)
    monkeypatch.setattr(
        overlay_provider,
        "_live_node_repository",
        _live_repository(_live_dataset("companies")),
    )
    overlay_provider._overlay_live_fields(response)
    assert graph_node.dataset_type == "pandas.csv_dataset.CSVDataset"


def test_overlay_sets_node_extras(overlay_provider, monkeypatch) -> None:
    graph_node = _graph_dataset("companies")
    response = _graph_response(graph_node)
    monkeypatch.setattr(
        overlay_provider,
        "_live_node_repository",
        _live_repository(
            _live_dataset(
                "companies", stats={"rows": 5}, styles={"backgroundColor": "#fff"}
            )
        ),
    )
    overlay_provider._overlay_live_fields(response)
    assert isinstance(graph_node.node_extras, NodeExtrasAPIResponse)
    assert graph_node.node_extras.stats == {"rows": 5}
    assert graph_node.node_extras.styles == {"backgroundColor": "#fff"}


def test_overlay_sets_task_parameters(overlay_provider, monkeypatch) -> None:
    """Resolving parameter values needs the loaded config, so they come from the live node."""
    live_node, graph_node = _task_pair(
        "apply_types", {"columns_as_floats": ["reviews_per_month"]}
    )
    response = _graph_response(graph_node)
    monkeypatch.setattr(
        overlay_provider, "_live_node_repository", _live_repository(live_node)
    )
    overlay_provider._overlay_live_fields(response)
    assert graph_node.parameters == {"columns_as_floats": ["reviews_per_month"]}


def test_overlay_only_sets_parameters_on_task_nodes(
    overlay_provider, monkeypatch
) -> None:
    """Both halves of the parameters guard matter, and a data node has no such field.

    ``GraphNodesRepository`` derives IDs from the object stored, so it cannot return a task node
    for a data node's ID; a stub can. Without the graph-node half of the guard this raises.
    """
    live_task, _ = _task_pair("apply_types", {"columns_as_floats": ["x"]})

    class _AlwaysTaskRepository:
        def get_node_by_id(self, node_id):
            return live_task

    graph_node = _graph_dataset("companies")
    response = _graph_response(graph_node)
    monkeypatch.setattr(
        overlay_provider, "_live_node_repository", _AlwaysTaskRepository()
    )

    overlay_provider._overlay_live_fields(response)

    assert not hasattr(graph_node, "parameters")
    assert graph_node.dataset_type is None


def test_overlay_leaves_unknown_nodes_untouched(overlay_provider, monkeypatch) -> None:
    """A node the live project does not know about keeps what the builder gave it."""
    graph_node = _graph_dataset("only_in_snapshot")
    _, graph_task = _task_pair("only_in_snapshot_task", {"unused": 1})
    response = _graph_response(graph_node, graph_task)
    monkeypatch.setattr(
        overlay_provider,
        "_live_node_repository",
        GraphNodesRepository(),
    )
    overlay_provider._overlay_live_fields(response)
    assert graph_node.dataset_type == "pandas.CSVDataset"
    assert graph_node.node_extras is None
    assert graph_task.parameters == {}


def test_first_served_response_does_not_change_the_graph_shape() -> None:
    """The overlay fills fields in; it must never add, drop or rename a node.

    Compares the builder's own output against what the endpoint serves, so this holds even if
    the captured baseline were wrong.
    """
    provider = InspectionAdapterProvider(
        DEMO_PROJECT,
        live_node_repository=_live_repository(
            _live_dataset("companies", stats={"rows": 5})
        ),
    )
    built = provider._builder.build("__default__")
    served = provider.get_pipeline_response()
    assert isinstance(served, GraphAPIResponse)

    served_companies = next(
        node for node in served.nodes if node.id == _create_dataset_node_id("companies")
    )
    assert served_companies.node_extras is not None
    assert served_companies.node_extras.stats == {"rows": 5}

    def node_shape(response):
        return sorted((n.id, n.type, n.name) for n in response.nodes)

    def edge_shape(response):
        return sorted((edge.source, edge.target) for edge in response.edges)

    assert node_shape(served) == node_shape(built)
    assert edge_shape(served) == edge_shape(built)


def test_overlay_finds_a_transcoded_dataset_through_the_real_repository(
    overlay_provider, monkeypatch
) -> None:
    """A transcoded graph node still picks up its live fields.

    Both sides strip transcoding when hashing, so ``ds@pandas`` in the live repository and ``ds``
    in the graph resolve to one ID.
    """
    live_node = _live_dataset("ds@pandas", stats={"rows": 7})
    assert isinstance(live_node, TranscodedDataNode)
    repository = _live_repository(live_node)
    graph_node = _graph_dataset("ds")
    response = _graph_response(graph_node)

    monkeypatch.setattr(overlay_provider, "_live_node_repository", repository)
    overlay_provider._overlay_live_fields(response)

    assert graph_node.dataset_type is None
    assert graph_node.node_extras is not None
    assert graph_node.node_extras.stats == {"rows": 7}
