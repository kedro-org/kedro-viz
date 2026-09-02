"""Tests for serving task source from the snapshot's node-source location.

Kedro reports each node's ``filepath`` plus a 1-based inclusive line range, so the code panel is
read from the file rather than from a live function object. Source is optional: Kedro versions
that predate the field, and functions it cannot locate, must degrade to no code rather than fail.
"""

import inspect
import json
from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi.responses import JSONResponse
from kedro.pipeline.node import Node as KedroNode

from kedro_viz.api.inspection_adapter_provider import (
    InspectionAdapterProvider,
    _read_task_source,
)
from kedro_viz.api.rest.responses.pipelines import GraphAPIResponse
from kedro_viz.data_access.repositories.graph import GraphNodesRepository
from kedro_viz.models.flowchart.node_metadata import TaskNodeMetadata

DEMO_PROJECT = Path(__file__).resolve().parents[3] / "demo-project"


def _source(filepath: str, line_start: int, line_end: int) -> SimpleNamespace:
    """A duck-typed ``NodeSourceSnapshot`` stand-in."""
    return SimpleNamespace(filepath=filepath, line_start=line_start, line_end=line_end)


# -- reading a source location ----------------------------------------------------------- #


def test_reads_the_reported_line_range(tmp_path: Path) -> None:
    """``line_start`` and ``line_end`` are 1-based and inclusive."""
    (tmp_path / "nodes.py").write_text("a\nb\nc\nd\n", encoding="utf-8")
    code, filepath = _read_task_source(tmp_path, _source("nodes.py", 2, 3))
    assert code == "b\nc"
    assert filepath == "nodes.py"


def test_resolves_a_project_relative_path(tmp_path: Path) -> None:
    nested = tmp_path / "src" / "pkg"
    nested.mkdir(parents=True)
    (nested / "nodes.py").write_text("x\n", encoding="utf-8")
    code, _ = _read_task_source(tmp_path, _source("src/pkg/nodes.py", 1, 1))
    assert code == "x"


def test_accepts_an_absolute_path(tmp_path: Path) -> None:
    target = tmp_path / "nodes.py"
    target.write_text("y\n", encoding="utf-8")
    code, _ = _read_task_source(Path("/nowhere"), _source(str(target), 1, 1))
    assert code == "y"


@pytest.mark.parametrize(
    "source",
    [
        None,  # Kedro could not locate the function, or the field is absent
        SimpleNamespace(filepath=None, line_start=1, line_end=2),
        SimpleNamespace(filepath="nodes.py", line_start=None, line_end=2),
        SimpleNamespace(filepath="nodes.py", line_start=1, line_end=None),
    ],
)
def test_missing_location_yields_no_source(tmp_path: Path, source: object) -> None:
    assert _read_task_source(tmp_path, source) == (None, None)


def test_unreadable_file_still_reports_the_filepath(tmp_path: Path) -> None:
    """The snapshot names the file even when it cannot be read from here."""
    code, filepath = _read_task_source(tmp_path, _source("gone.py", 1, 2))
    assert code is None
    assert filepath == "gone.py"


# -- end to end on the demo project -------------------------------------------------------- #


@pytest.fixture(scope="module")
def lite_provider(_restore_kedro_project_state) -> InspectionAdapterProvider:
    """Adapter with no live nodes, so metadata is served from the snapshot alone."""
    return InspectionAdapterProvider(DEMO_PROJECT, live_nodes=GraphNodesRepository())


def _graph(provider: InspectionAdapterProvider) -> dict:
    response = provider.get_pipeline_response()
    assert isinstance(response, GraphAPIResponse)
    return response.model_dump()


def _task_ids(provider: InspectionAdapterProvider) -> list[str]:
    return [n["id"] for n in _graph(provider)["nodes"] if n["type"] == "task"]


def test_lite_mode_serves_code_for_every_task(
    lite_provider: InspectionAdapterProvider,
) -> None:
    """Without a live project, every demo task still has its code and filepath."""
    task_ids = _task_ids(lite_provider)
    assert task_ids

    for task_id in task_ids:
        response = lite_provider.get_node_metadata_response(task_id)
        assert isinstance(response, JSONResponse)
        payload = json.loads(response.body)
        assert payload["code"], task_id
        assert payload["filepath"], task_id


def test_source_matches_what_the_live_function_reports(
    lite_provider: InspectionAdapterProvider,
) -> None:
    """The sliced source is identical to ``inspect.getsource`` on the real function.

    This is the parity that matters: the code panel must not change now that it no longer
    comes from a live function object.
    """
    from kedro.framework.project import pipelines as kedro_pipelines

    live_by_name = {
        node.name: node for pipe in kedro_pipelines.values() for node in pipe.nodes
    }
    graph = _graph(lite_provider)
    compared = 0
    for graph_node in graph["nodes"]:
        if graph_node["type"] != "task":
            continue
        live_node = live_by_name.get(graph_node["full_name"])
        if live_node is None:
            continue
        response = lite_provider.get_node_metadata_response(graph_node["id"])
        assert isinstance(response, JSONResponse)
        served = json.loads(response.body)["code"]
        assert served.strip() == inspect.getsource(live_node.func).strip()
        compared += 1
    assert compared, "expected at least one task to compare"


def test_full_mode_prefers_the_snapshot_over_the_live_object(
    _restore_kedro_project_state,
) -> None:
    """With live nodes present, code still comes from the snapshot location."""
    from kedro_viz.data_access import data_access_manager
    from kedro_viz.integrations.kedro import data_loader
    from kedro_viz.server import populate_data

    catalog, pipelines, node_extras = data_loader.load_data(DEMO_PROJECT)
    populate_data(data_access_manager, catalog, pipelines, node_extras)

    provider = InspectionAdapterProvider(DEMO_PROJECT)
    assert provider._metadata_bridge, "expected the live bridge to be populated"

    for task_id in _task_ids(provider):
        response = provider.get_node_metadata_response(task_id)
        assert isinstance(response, TaskNodeMetadata)
        assert response.code
        kedro_node = response.task_node.kedro_obj
        assert isinstance(kedro_node, KedroNode)
        assert response.code.strip() == inspect.getsource(kedro_node.func).strip()


def test_source_file_is_read_once_per_task(
    lite_provider: InspectionAdapterProvider,
) -> None:
    """Repeated requests reuse the cached read rather than touching the file again."""
    task_id = _task_ids(lite_provider)[0]
    lite_provider.get_node_metadata_response(task_id)
    assert task_id in lite_provider._source_cache
    cached = lite_provider._source_cache[task_id]
    lite_provider.get_node_metadata_response(task_id)
    assert lite_provider._source_cache[task_id] is cached
