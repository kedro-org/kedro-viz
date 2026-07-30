"""Tests for legacy-compatible Viz node IDs.

The node list is read hermetically from ``baseline/node_id_report.json`` (no Kedro project load).
"""

import json
from pathlib import Path

import pytest

from kedro_viz.integrations.kedro import node_ids as ids
from kedro_viz.utils import _hash

BASELINE = Path(__file__).parent / "baseline" / "node_id_report.json"


@pytest.fixture(scope="module")
def task_nodes() -> list[dict]:
    return json.loads(BASELINE.read_text(encoding="utf-8"))["nodes"]


def _task_id(node: dict) -> str:
    return ids._create_task_node_id(
        node_name=node["snapshot_name"],
        func_name=node["func_name"],
        namespace=node["namespace"],
        inputs=node["inputs"],
        outputs=node["outputs"],
    )


def test_task_node_ids_match_legacy_backend(task_nodes: list[dict]) -> None:
    """Reconstructed IDs match the graph and run-status baseline."""
    for node in task_nodes:
        assert (
            _task_id(node)
            == _hash(node["str_node"])
            == node["graph_id"]
            == node["runstatus_hook_id"]
        ), f"ID mismatch for {node['snapshot_name']!r}"


def test_task_node_ids_are_unique(task_nodes: list[dict]) -> None:
    """Distinct demo tasks have distinct IDs."""
    computed = [_task_id(node) for node in task_nodes]
    assert len(set(computed)) == len(computed)


def test_explicit_task_name_and_function_name_are_preserved() -> None:
    expected = _hash("company_agg: aggregate_company_data([x]) -> [y]")
    assert (
        ids._create_task_node_id(
            node_name="ingestion.company_agg",
            func_name="aggregate_company_data",
            namespace="ingestion",
            inputs=["x"],
            outputs=["y"],
        )
        == expected
    )


def test_auto_name_is_omitted_from_task_string() -> None:
    expected = _hash("clean_data([x]) -> [y]")
    assert (
        ids._create_task_node_id(
            node_name="processing.clean_data__a1b2c3d4",
            func_name="clean_data",
            namespace="processing",
            inputs=["x"],
            outputs=["y"],
        )
        == expected
    )


def test_hash_like_explicit_name_is_preserved() -> None:
    expected = _hash("report__deadbeef: build_report([x]) -> [y]")
    assert (
        ids._create_task_node_id(
            node_name="report__deadbeef",
            func_name="build_report",
            namespace=None,
            inputs=["x"],
            outputs=["y"],
        )
        == expected
    )


@pytest.mark.parametrize(
    ("func_name", "node_string"),
    [("<partial>", "<partial>([x]) -> [y]"), ("clean_data", "clean_data([x]) -> [y]")],
)
def test_partial_auto_name_is_omitted_from_task_string(
    func_name: str, node_string: str
) -> None:
    assert ids._create_task_node_id(
        node_name="partial(clean_data)__a1b2c3d4",
        func_name=func_name,
        namespace=None,
        inputs=["x"],
        outputs=["y"],
    ) == _hash(node_string)


def test_task_ids_do_not_collide_with_dataset_ids(task_nodes: list[dict]) -> None:
    """Test that task IDs never collide with dataset IDs."""
    task_ids = {_task_id(node) for node in task_nodes}
    dataset_ids = set()
    for node in task_nodes:
        for name in node["inputs"] + node["outputs"]:
            dataset_ids.add(ids._create_dataset_node_id(name))
    assert task_ids.isdisjoint(dataset_ids)


def test_dataset_node_id_matches_backend_hash() -> None:
    """Test that a dataset ID matches the backend ``_hash`` of its name."""
    assert ids._create_dataset_node_id("companies") == _hash("companies")


def test_dataset_node_id_strips_transcoding() -> None:
    """Test that transcoded names (``name@suffix``) hash on the base name."""
    assert ids._create_dataset_node_id(
        "typed_shuttles@pandas1"
    ) == ids._create_dataset_node_id("typed_shuttles@pandas2")


@pytest.mark.parametrize(
    ("name", "func_name", "inputs", "outputs", "node_string"),
    [
        ("generator__a1b2c3d4", "generator", [], ["out"], "generator(None) -> [out]"),
        ("saver__a1b2c3d4", "saver", ["in"], [], "saver([in]) -> None"),
    ],
)
def test_task_node_id_handles_empty_io(
    name: str,
    func_name: str,
    inputs: list[str],
    outputs: list[str],
    node_string: str,
) -> None:
    assert ids._create_task_node_id(
        node_name=name,
        func_name=func_name,
        namespace=None,
        inputs=inputs,
        outputs=outputs,
    ) == _hash(node_string)
