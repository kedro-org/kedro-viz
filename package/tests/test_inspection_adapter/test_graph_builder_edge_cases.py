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
) -> SimpleNamespace:
    return SimpleNamespace(
        name=name,
        inputs=inputs,
        outputs=outputs,
        namespace=namespace,
        tags=set(),
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
