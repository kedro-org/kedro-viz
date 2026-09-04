"""Tests for metadata fields calculated from live Kedro objects."""

from pathlib import Path

import pytest
from kedro.io import MemoryDataset
from kedro.pipeline.node import node
from kedro_datasets.pandas import CSVDataset

from kedro_viz.models.flowchart.live_node_metadata import (
    _warn_missing_task_preview_contract,
    get_data_node_preview,
    get_data_node_preview_type,
    get_task_filepath,
    get_task_preview,
)
from kedro_viz.models.flowchart.nodes import GraphNode


def identity(value):
    return value


def _data_node(dataset):
    return GraphNode.create_data_node(
        dataset_id="dataset",
        dataset_name="dataset",
        layer=None,
        tags=set(),
        dataset=dataset,
        node_extras=None,
        modular_pipelines=set(),
    )


def test_task_filepath_falls_back_to_absolute_path(mocker):
    kedro_node = node(identity, inputs="x", outputs="y", name="identity_node")
    task_node = GraphNode.create_task_node(kedro_node, "identity_node", set())
    mocker.patch.object(Path, "cwd", return_value=Path("/unrelated/project"))

    filepath = get_task_filepath(task_node)

    assert filepath == str(Path(__file__).resolve())


def test_data_preview_helper_passes_preview_arguments(mocker):
    dataset = CSVDataset(
        filepath="test.csv",
        metadata={"kedro-viz": {"preview_args": {"nrows": 3}}},
    )
    data_node = _data_node(dataset)
    preview = mocker.patch.object(dataset, "preview", return_value={"rows": []})

    assert get_data_node_preview(data_node, include_previews=True) == {"rows": []}
    preview.assert_called_once_with(nrows=3)


@pytest.mark.parametrize(
    ("dataset_factory", "include_previews"),
    [
        pytest.param(
            lambda: CSVDataset(
                filepath="test.csv",
                metadata={"kedro-viz": {"preview": False}},
            ),
            True,
            id="node-opt-out",
        ),
        pytest.param(
            lambda: MemoryDataset(data=1),
            True,
            id="dataset-without-preview",
        ),
        pytest.param(
            lambda: CSVDataset(filepath="test.csv"),
            False,
            id="request-opt-out",
        ),
    ],
)
def test_data_preview_helpers_respect_disable_conditions(
    dataset_factory, include_previews
):
    data_node = _data_node(dataset_factory())

    assert get_data_node_preview(data_node, include_previews=include_previews) is None
    assert (
        get_data_node_preview_type(data_node, include_previews=include_previews) is None
    )


def test_data_preview_type_failure_is_logged(mocker, caplog):
    data_node = _data_node(CSVDataset(filepath="test.csv"))
    mocker.patch(
        "kedro_viz.models.flowchart.live_node_metadata.inspect.signature",
        side_effect=ValueError("signature unavailable"),
    )

    assert get_data_node_preview_type(data_node, include_previews=True) is None
    assert "'dataset' did not have preview type" in caplog.text
    assert "ValueError: signature unavailable" in caplog.text


def test_task_preview_import_error_warns_once(mocker, caplog):
    from kedro.pipeline.preview_contract import TextPreview

    kedro_node = node(
        identity,
        inputs="x",
        outputs="y",
        name="preview_node",
        preview_fn=lambda: TextPreview(content="content"),
    )
    task_node = GraphNode.create_task_node(kedro_node, "preview_node", set())
    mocker.patch(
        "kedro_viz.models.flowchart.live_node_metadata."
        "_get_supported_task_preview_types",
        side_effect=ImportError,
    )
    _warn_missing_task_preview_contract.cache_clear()

    try:
        assert get_task_preview(task_node) is None
        assert get_task_preview(task_node) is None
    finally:
        _warn_missing_task_preview_contract.cache_clear()

    assert caplog.text.count("Task node previews are disabled") == 1
