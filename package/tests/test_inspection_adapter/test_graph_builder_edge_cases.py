"""Hermetic edge-case tests for the inspection graph builder.

These tests use small snapshot stand-ins instead of bootstrapping the demo project, so they run
even when the local Kedro version does not expose ``kedro.inspection``. The stand-ins are
``SimpleNamespace`` objects that duck-type the snapshot models the builder reads; calls into
``GraphBuilder`` are cast to the snapshot type (string-literal, resolved only under type-checking)
so mypy stays honest without importing the real dataclass at runtime.
"""

from types import SimpleNamespace
from typing import TYPE_CHECKING, cast

from kedro_viz.api.rest.responses.pipelines import DataNodeAPIResponse
from kedro_viz.integrations.kedro.inspection.graph_builder import GraphBuilder

if TYPE_CHECKING:
    from kedro.inspection.models import ProjectSnapshot


def _builder(snapshot: SimpleNamespace) -> GraphBuilder:
    """Build a ``GraphBuilder`` from a duck-typed snapshot stand-in."""
    return GraphBuilder(cast("ProjectSnapshot", snapshot))


def _node(
    name: str,
    inputs: list[str],
    outputs: list[str],
    *,
    namespace: str | None = None,
    tags: set[str] | None = None,
) -> SimpleNamespace:
    return SimpleNamespace(
        name=name,
        inputs=inputs,
        outputs=outputs,
        namespace=namespace,
        tags=tags or set(),
    )


def _pipeline(name: str, nodes: list[SimpleNamespace]) -> SimpleNamespace:
    return SimpleNamespace(name=name, nodes=nodes)


def _snapshot(
    pipelines: list[SimpleNamespace],
    datasets: dict[str, SimpleNamespace] | None = None,
) -> SimpleNamespace:
    return SimpleNamespace(pipelines=pipelines, datasets=datasets or {})


def test_task_pipeline_membership_uses_task_identity_not_name() -> None:
    """Same-name tasks with different I/O must not inherit each other's pipelines."""
    pipe_a_node = _node("shared.task", ["a"], ["b"])
    pipe_b_node = _node("shared.task", ["x"], ["y"])
    builder = _builder(
        _snapshot(
            [
                _pipeline("pipe_a", [pipe_a_node]),
                _pipeline("pipe_b", [pipe_b_node]),
            ]
        )
    )

    pipe_a_task = next(
        node for node in builder.build("pipe_a").nodes if node.type == "task"
    )
    pipe_b_task = next(
        node for node in builder.build("pipe_b").nodes if node.type == "task"
    )

    assert pipe_a_task.pipelines == ["pipe_a"]
    assert pipe_b_task.pipelines == ["pipe_b"]


def test_transcoded_dataset_type_resolves_from_stripped_catalog_name() -> None:
    """Snapshots key catalog datasets by base name while graph refs may be transcoded."""
    builder = _builder(
        _snapshot(
            [_pipeline("__default__", [_node("consume_ds", ["ds@pandas"], ["out"])])],
            {
                "ds": SimpleNamespace(type="pandas.CSVDataset"),
                "out": SimpleNamespace(type="kedro.io.MemoryDataset"),
            },
        )
    )

    ds_node = next(
        node
        for node in builder.build("__default__").nodes
        if node.type == "data" and node.name == "ds"
    )
    assert isinstance(ds_node, DataNodeAPIResponse)
    assert ds_node.dataset_type == "pandas.CSVDataset"


def test_unregistered_dataset_type_is_synthesized_as_memory_dataset() -> None:
    """A dataset with no catalog entry is in-memory; emit the same string the live path does."""
    builder = _builder(
        _snapshot(
            [_pipeline("__default__", [_node("produce", ["raw"], ["intermediate"])])],
            {"raw": SimpleNamespace(type="pandas.CSVDataset")},
        )
    )

    nodes = builder.build("__default__").nodes
    memory_node = next(
        n for n in nodes if n.type == "data" and n.name == "intermediate"
    )
    assert isinstance(memory_node, DataNodeAPIResponse)
    assert memory_node.dataset_type == "io.memory_dataset.MemoryDataset"


def test_empty_catalog_type_string_maps_to_none() -> None:
    """The snapshot may carry ``type=""`` for malformed entries; don't surface the empty string."""
    builder = _builder(
        _snapshot(
            [_pipeline("__default__", [_node("consume", ["typeless"], ["out"])])],
            {"typeless": SimpleNamespace(type="")},
        )
    )

    nodes = builder.build("__default__").nodes
    typeless_node = next(n for n in nodes if n.type == "data" and n.name == "typeless")
    assert isinstance(typeless_node, DataNodeAPIResponse)
    assert typeless_node.dataset_type is None


def test_tags_are_aggregated_globally_across_pipeline_views() -> None:
    """A task/dataset shared by several pipelines shows the union of every pipeline's tags.

    The two pipelines register the same node identity (name/inputs/outputs) and a shared
    dataset, but tag them differently; both must surface the global tag union in either view.
    """
    shared_in, shared_out = "shared_in", "shared_out"
    builder = _builder(
        _snapshot(
            [
                _pipeline(
                    "pipe_a",
                    [_node("shared_task", [shared_in], [shared_out], tags={"a"})],
                ),
                _pipeline(
                    "pipe_b",
                    [_node("shared_task", [shared_in], [shared_out], tags={"b"})],
                ),
            ]
        )
    )

    for pipeline_id in ("pipe_a", "pipe_b"):
        nodes = builder.build(pipeline_id).nodes
        task = next(n for n in nodes if n.type == "task")
        dataset = next(n for n in nodes if n.type == "data" and n.name == shared_in)
        assert task.tags == ["a", "b"]
        assert dataset.tags == ["a", "b"]
