"""Static-export tests under the inspection adapter (Phase 6.5).

Builds an :class:`InspectionAdapterProvider` against the demo project (with
``data_access_manager`` populated so the metadata bridge has real entries), then exports the API
file set into ``tmp_path`` and asserts:

- ``api/main`` and one file per registered pipeline land under ``api/pipelines/``.
- Every metadata-bearing node id from ``api/main`` has a matching ``api/nodes/{id}`` file.
- ``api/run-status`` is written.

This is the gate from the plan: under the experimental flag, the exported file set carries
adapter (new-scheme) IDs end-to-end.
"""

import json
from pathlib import Path
from typing import Iterator

import fsspec
import pytest

from kedro_viz.api.inspection_adapter_provider import InspectionAdapterProvider
from kedro_viz.api.rest.responses.pipelines import GraphAPIResponse
from kedro_viz.integrations.kedro.inspection import snapshot_source

REPO_ROOT = Path(__file__).resolve().parents[3]
DEMO_PROJECT = REPO_ROOT / "demo-project"

pytestmark = pytest.mark.skipif(
    not snapshot_source.is_inspection_available(),
    reason="kedro inspection API unavailable (requires kedro>=1.4.0)",
)


@pytest.fixture(scope="module")
def _populated_demo(_restore_kedro_project_state) -> Iterator[None]:
    """Populate the module-singleton ``data_access_manager`` from the demo project once."""
    from kedro_viz.data_access import data_access_manager
    from kedro_viz.data_access.managers import DataAccessManager
    from kedro_viz.integrations.kedro import data_loader as kedro_data_loader
    from kedro_viz.server import populate_data

    catalog, pipelines, node_extras_dict = kedro_data_loader.load_data(DEMO_PROJECT)
    populate_data(data_access_manager, catalog, pipelines, node_extras_dict)

    yield

    fresh = DataAccessManager()
    data_access_manager.__dict__.clear()
    data_access_manager.__dict__.update(fresh.__dict__)


@pytest.fixture(scope="module")
def demo_provider(_populated_demo) -> InspectionAdapterProvider:
    return InspectionAdapterProvider(DEMO_PROJECT)


def test_export_writes_main_and_pipeline_files(
    demo_provider: InspectionAdapterProvider, tmp_path: Path
) -> None:
    """Every registered pipeline gets a file and `/api/main` lands at the root."""
    out_dir = tmp_path / "build"
    demo_provider.save_api_responses_to_fs(
        str(out_dir), fsspec.filesystem("file"), True
    )

    assert (out_dir / "api" / "main").is_file()
    expected_pipelines = set(demo_provider.get_pipeline_ids())
    assert expected_pipelines, "demo project should declare pipelines"
    written_pipelines = {
        p.name for p in (out_dir / "api" / "pipelines").iterdir() if p.is_file()
    }
    assert written_pipelines == expected_pipelines


def test_export_writes_a_metadata_file_per_main_node(
    demo_provider: InspectionAdapterProvider, tmp_path: Path
) -> None:
    """Every metadata-bearing id in ``api/main`` resolves to a file in ``api/nodes/``."""
    out_dir = tmp_path / "build"
    demo_provider.save_api_responses_to_fs(
        str(out_dir), fsspec.filesystem("file"), True
    )

    main = json.loads((out_dir / "api" / "main").read_text(encoding="utf-8"))
    # Only the types the bridge addresses (i.e. excludes modular pipeline nodes which the live
    # path serves as empty `{}` — see InspectionAdapterProvider._new_id_for).
    metadata_ids = {
        n["id"] for n in main["nodes"] if n["type"] in {"task", "data", "parameters"}
    }
    written_node_files = {
        p.name for p in (out_dir / "api" / "nodes").iterdir() if p.is_file()
    }
    missing = metadata_ids - written_node_files
    assert not missing, f"missing node files for ids: {sorted(missing)[:5]}"


def test_export_writes_run_status_file(
    demo_provider: InspectionAdapterProvider, tmp_path: Path
) -> None:
    out_dir = tmp_path / "build"
    demo_provider.save_api_responses_to_fs(
        str(out_dir), fsspec.filesystem("file"), True
    )

    assert (out_dir / "api" / "run-status").is_file()


def test_exported_main_carries_new_scheme_ids(
    demo_provider: InspectionAdapterProvider, tmp_path: Path
) -> None:
    """The id format in the exported ``api/main`` matches what the adapter graph emits live."""
    out_dir = tmp_path / "build"
    demo_provider.save_api_responses_to_fs(
        str(out_dir), fsspec.filesystem("file"), True
    )

    live_result = demo_provider.get_pipeline_response()
    assert isinstance(live_result, GraphAPIResponse)
    live_main = live_result.model_dump()
    exported_main = json.loads((out_dir / "api" / "main").read_text(encoding="utf-8"))

    live_ids = {n["id"] for n in live_main["nodes"]}
    exported_ids = {n["id"] for n in exported_main["nodes"]}
    assert live_ids == exported_ids


def test_exported_main_preserves_enriched_graph_fields(
    demo_provider: InspectionAdapterProvider, tmp_path: Path
) -> None:
    """Graph fields enriched from the bridge must survive static export."""
    out_dir = tmp_path / "build"
    demo_provider.save_api_responses_to_fs(
        str(out_dir), fsspec.filesystem("file"), True
    )

    live_result = demo_provider.get_pipeline_response()
    assert isinstance(live_result, GraphAPIResponse)
    live_main = live_result.model_dump()
    exported_main = json.loads((out_dir / "api" / "main").read_text(encoding="utf-8"))
    exported_by_id = {node["id"]: node for node in exported_main["nodes"]}

    task_with_params = next(
        node
        for node in live_main["nodes"]
        if node["type"] == "task" and node["parameters"]
    )
    node_with_extras = next(
        node for node in live_main["nodes"] if node.get("node_extras")
    )

    assert (
        exported_by_id[task_with_params["id"]]["parameters"]
        == task_with_params["parameters"]
    )
    assert (
        exported_by_id[node_with_extras["id"]]["node_extras"]
        == node_with_extras["node_extras"]
    )
