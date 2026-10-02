"""Tests for Viz node IDs that stay compatible with the live backend."""

import pytest

from kedro_viz.integrations.kedro import node_ids as ids
from kedro_viz.utils import _hash


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


def test_task_node_id_changes_with_io() -> None:
    def task_id(inputs: list[str], outputs: list[str]) -> str:
        return ids._create_task_node_id(
            node_name="my_node",
            func_name="build_data",
            namespace=None,
            inputs=inputs,
            outputs=outputs,
        )

    base = task_id(["a"], ["b"])
    assert task_id(["a", "c"], ["b"]) != base
    assert task_id(["a"], ["b", "c"]) != base


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
