"""Tests for the Viz node-ID scheme.

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
        node["snapshot_name"], node["inputs"], node["outputs"]
    )


def test_task_node_id_is_deterministic(task_nodes: list[dict]) -> None:
    """Test that the same inputs always hash to the same ID."""
    for node in task_nodes:
        assert _task_id(node) == _task_id(node)


def test_stored_graph_id_matches_current_scheme(task_nodes: list[dict]) -> None:
    """Test that each stored ``graph_id`` still matches what ``_create_task_node_id`` computes."""
    for node in task_nodes:
        assert node["graph_id"] == _task_id(node), (
            f"stale baseline for {node['snapshot_name']!r}: regenerate "
            "node_id_report.json via capture_baseline.py"
        )


def test_every_task_node_gets_an_id(task_nodes: list[dict]) -> None:
    """Test that every task node resolves to an ID, including ``name != func`` nodes."""
    assert all(_task_id(node) for node in task_nodes)


def test_task_node_ids_are_unique(task_nodes: list[dict]) -> None:
    """Test that distinct task nodes get distinct IDs."""
    computed = [_task_id(node) for node in task_nodes]
    assert len(set(computed)) == len(computed)


def test_task_node_id_excludes_tags() -> None:
    """Test that the ID hashes exactly ``name``, ``inputs`` and ``outputs``."""
    expected = _hash(json.dumps(["ingestion.company_agg", ["x"], ["y"]]))
    assert ids._create_task_node_id("ingestion.company_agg", ["x"], ["y"]) == expected


def test_task_node_id_changes_with_io() -> None:
    """Test that adding an input or output changes the ID."""
    base = ids._create_task_node_id("n", ["a"], ["b"])
    assert base != ids._create_task_node_id("n", ["a", "c"], ["b"])
    assert base != ids._create_task_node_id("n", ["a"], ["b", "c"])


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


def test_task_node_id_handles_missing_inputs_or_outputs() -> None:
    """Test that a source node (no inputs) and a sink node (no outputs) get valid, distinct IDs."""
    source = ids._create_task_node_id("generator", [], ["out_c"])
    sink = ids._create_task_node_id("saver", ["in_a"], [])
    assert source and sink
    assert source != sink
