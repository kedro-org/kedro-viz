"""Hermetic edge-case tests for the inspection graph builder.

These tests use small snapshot stand-ins instead of bootstrapping the demo project, so they run
even when the local Kedro version does not expose ``kedro.inspection``. The stand-ins are
``SimpleNamespace`` objects that duck-type the snapshot models the builder reads; calls into
``GraphBuilder`` are cast to the snapshot type (string-literal, resolved only under type-checking)
so mypy stays honest without importing the real dataclass at runtime.
"""

from types import SimpleNamespace
from typing import TYPE_CHECKING, Any, cast

import pytest

from kedro_viz.api.rest.responses.pipelines import DataNodeAPIResponse
from kedro_viz.integrations.kedro.inspection.graph_builder import (
    GraphBuilder,
    _display_name,
)

if TYPE_CHECKING:
    from kedro.inspection.models import ProjectSnapshot


def _builder(
    snapshot: SimpleNamespace, catalog_config: dict[str, Any] | None = None
) -> GraphBuilder:
    """Build a ``GraphBuilder`` from a duck-typed snapshot stand-in."""
    return GraphBuilder(cast("ProjectSnapshot", snapshot), catalog_config)


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


def test_transcoded_dataset_type_is_none() -> None:
    """Transcoded datasets carry no single type, matching the legacy backend."""
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
    """``ds@pandas`` and ``ds@spark`` collapse to a single ``ds`` node with one edge."""
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


def test_no_catalog_config_yields_empty_layers() -> None:
    builder = _builder(
        _snapshot([_pipeline("__default__", [_node("t", ["x"], ["y"])])])
    )
    graph = builder.build("__default__")
    assert graph.layers == []
    data_nodes = [
        node
        for node in graph.nodes
        if isinstance(node, DataNodeAPIResponse) and node.type == "data"
    ]
    assert data_nodes
    assert all(node.layer is None for node in data_nodes)


def test_layers_from_catalog_config_are_sorted_topologically() -> None:
    snapshot = _snapshot([_pipeline("__default__", [_node("t", ["x"], ["y"])])])
    catalog_config = {
        "x": {"metadata": {"kedro-viz": {"layer": "raw"}}},
        "y": {"metadata": {"kedro-viz": {"layer": "model"}}},
    }
    graph = _builder(snapshot, catalog_config).build("__default__")
    layer_by_name = {
        node.name: node.layer
        for node in graph.nodes
        if isinstance(node, DataNodeAPIResponse) and node.type == "data"
    }
    assert layer_by_name == {"x": "raw", "y": "model"}
    # x -> t -> y, so the raw layer sorts before the model layer.
    assert graph.layers == ["raw", "model"]


def test_factory_layer_is_resolved_for_concrete_dataset() -> None:
    snapshot = _snapshot(
        [
            _pipeline(
                "__default__", [_node("t", ["processing.int_companies"], ["model"])]
            )
        ]
    )
    catalog_config = {
        "{namespace}.int_{name}": {
            "metadata": {"kedro-viz": {"layer": "intermediate"}}
        },
        "model": {"metadata": {"kedro-viz": {"layer": "model"}}},
    }
    graph = _builder(snapshot, catalog_config).build("__default__")
    layer_by_name = {
        node.name: node.layer
        for node in graph.nodes
        if isinstance(node, DataNodeAPIResponse) and node.type == "data"
    }
    assert layer_by_name["processing.int_companies"] == "intermediate"


def test_factory_layer_does_not_apply_to_parameters() -> None:
    """A broad factory pattern must not give parameters a layer, in any pipeline view.

    ``pipe_b`` does not use the parameter, so a parameter-derived layer would otherwise leak
    into its layer list as a phantom entry that no rendered node carries.
    """
    snapshot = _snapshot(
        [
            _pipeline("pipe_a", [_node("a", ["params:model_options"], ["out_a"])]),
            _pipeline("pipe_b", [_node("b", ["raw"], ["out_b"])]),
        ]
    )
    catalog_config = {
        # Only parameter references can match this pattern, so any resulting layer is a phantom.
        "params:{name}": {"metadata": {"kedro-viz": {"layer": "params_layer"}}},
        "raw": {"metadata": {"kedro-viz": {"layer": "raw"}}},
    }
    builder = _builder(snapshot, catalog_config)

    parameter = next(
        node
        for node in builder.build("pipe_a").nodes
        if isinstance(node, DataNodeAPIResponse) and node.type == "parameters"
    )
    assert parameter.layer is None
    for pipeline_id in ("pipe_a", "pipe_b"):
        assert "params_layer" not in builder.build(pipeline_id).layers


def test_layers_include_all_pipelines_but_exclude_unused_catalog_entries() -> None:
    snapshot = _snapshot(
        [
            _pipeline("pipe_a", [_node("a", ["raw_data"], ["model"])]),
            _pipeline("pipe_b", [_node("b", ["external"], ["report"])]),
        ]
    )
    catalog_config = {
        "raw_data": {"metadata": {"kedro-viz": {"layer": "raw"}}},
        "model": {"metadata": {"kedro-viz": {"layer": "model"}}},
        "external": {"metadata": {"kedro-viz": {"layer": "external"}}},
        "report": {"metadata": {"kedro-viz": {"layer": "reporting"}}},
        "orphan": {"metadata": {"kedro-viz": {"layer": "unused"}}},
    }
    graph = _builder(snapshot, catalog_config).build("pipe_a")
    assert set(graph.layers) == {"raw", "model", "external", "reporting"}
