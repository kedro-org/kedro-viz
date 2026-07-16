"""Hermetic edge cases for the snapshot graph builder."""

from types import SimpleNamespace
from typing import TYPE_CHECKING, cast

import pytest

from kedro_viz.api.rest.responses.pipelines import DataNodeAPIResponse
from kedro_viz.integrations.kedro.inspection.graph_builder import (
    GraphBuilder,
    _display_name,
)

if TYPE_CHECKING:
    from kedro.inspection.models import ProjectSnapshot


def _builder(snapshot: SimpleNamespace) -> GraphBuilder:
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


def test_task_pipelines_use_task_identity_not_name() -> None:
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


def test_transcoded_dataset_type_is_none() -> None:
    builder = _builder(
        _snapshot(
            [_pipeline("__default__", [_node("consume_ds", ["ds@pandas"], ["out"])])],
            {
                "ds@pandas": SimpleNamespace(type="pandas.CSVDataset"),
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
    assert ds_node.dataset_type is None


def test_transcoded_variants_share_one_dataset_node() -> None:
    builder = _builder(
        _snapshot(
            [
                _pipeline(
                    "__default__",
                    [_node("consume_ds", ["ds@pandas", "ds@spark"], ["out"])],
                )
            ],
            {
                "ds@pandas": SimpleNamespace(type="pandas.CSVDataset"),
                "ds@spark": SimpleNamespace(type="spark.SparkDataset"),
            },
        )
    )

    graph = builder.build("__default__")
    dataset_nodes = [
        node for node in graph.nodes if node.type == "data" and node.name == "ds"
    ]
    assert len(dataset_nodes) == 1
    dataset_id = dataset_nodes[0].id
    assert sum(edge.source == dataset_id for edge in graph.edges) == 1


def test_unregistered_dataset_type_is_synthesized_as_memory_dataset() -> None:
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


def test_parameter_dataset_type_is_none() -> None:
    builder = _builder(
        _snapshot(
            [
                _pipeline(
                    "__default__", [_node("consume", ["params:model_options"], ["out"])]
                )
            ]
        )
    )

    parameter_node = next(
        node for node in builder.build("__default__").nodes if node.type == "parameters"
    )
    assert isinstance(parameter_node, DataNodeAPIResponse)
    assert parameter_node.dataset_type is None


def test_default_pipeline_id_falls_back_to_first_when_no_default() -> None:
    builder = _builder(
        _snapshot(
            [
                _pipeline("first_pipe", [_node("a", ["x"], ["y"])]),
                _pipeline("second_pipe", [_node("b", ["y"], ["z"])]),
            ]
        )
    )
    assert builder.default_pipeline_id() == "first_pipe"


def test_default_pipeline_id_rejects_empty_snapshot() -> None:
    builder = _builder(_snapshot([]))
    with pytest.raises(ValueError, match="No registered pipelines"):
        builder.default_pipeline_id()


def test_has_pipeline_reports_registered_pipelines() -> None:
    builder = _builder(
        _snapshot([_pipeline("__default__", [_node("a", ["x"], ["y"])])])
    )
    assert builder.has_pipeline("__default__") is True
    assert builder.has_pipeline("nonexistent") is False


def test_pipeline_ids_preserve_declaration_order() -> None:
    builder = _builder(
        _snapshot(
            [
                _pipeline("second", [_node("b", ["y"], ["z"])]),
                _pipeline("first", [_node("a", ["x"], ["y"])]),
            ]
        )
    )
    assert builder.pipeline_ids() == ["second", "first"]


def test_task_and_dataset_tags_aggregate_across_pipelines() -> None:
    """Shared node tags are global across pipeline views."""
    builder = _builder(
        _snapshot(
            [
                _pipeline(
                    "pipe_a", [_node("shared.task", ["ds"], ["out"], tags={"a"})]
                ),
                _pipeline(
                    "pipe_b", [_node("shared.task", ["ds"], ["out"], tags={"b"})]
                ),
            ]
        )
    )

    for view in ("pipe_a", "pipe_b"):
        nodes = builder.build(view).nodes
        task = next(n for n in nodes if n.type == "task")
        dataset = next(n for n in nodes if n.type == "data" and n.name == "ds")
        assert task.tags == ["a", "b"], f"task tags not aggregated in {view}"
        assert dataset.tags == ["a", "b"], f"dataset tags not aggregated in {view}"


def test_source_and_sink_nodes_have_expected_edges() -> None:
    builder = _builder(
        _snapshot(
            [
                _pipeline(
                    "__default__",
                    [
                        _node("make", [], ["produced"]),
                        _node("consume", ["produced"], []),
                    ],
                )
            ]
        )
    )
    graph = builder.build("__default__").model_dump()
    label_by_id = {
        n["id"]: (n["full_name"] if n["type"] == "task" else n["name"])
        for n in graph["nodes"]
    }
    edges = {
        (label_by_id[e["source"]], label_by_id[e["target"]]) for e in graph["edges"]
    }
    assert edges == {("make", "produced"), ("produced", "consume")}


def test_build_rejects_unknown_pipeline_id() -> None:
    """``build()`` raises a clear ``ValueError`` (not an opaque ``KeyError``) for a bad id."""
    builder = _builder(
        _snapshot([_pipeline("__default__", [_node("a", ["x"], ["y"])])])
    )
    with pytest.raises(ValueError, match="Invalid pipeline ID"):
        builder.build("nonexistent")


@pytest.mark.parametrize(
    ("name", "namespace", "expected"),
    [
        ("clean_data__a1b2c3d4", None, "clean_data"),  # auto-named: strip __<8 hex>
        ("my_node", None, "my_node"),  # explicit name, no namespace
        ("ns.my_node", "ns", "my_node"),  # explicit name, namespace stripped
        ("ns.clean_data__a1b2c3d4", "ns", "clean_data"),  # namespace strip + auto-name
        ("report__notahex", None, "report__notahex"),  # non-hex suffix is kept as-is
    ],
)
def test_display_name(name: str, namespace: str | None, expected: str) -> None:
    """Display name strips the namespace prefix and any auto-name ``__<hash>`` suffix."""
    assert _display_name(name, namespace) == expected
