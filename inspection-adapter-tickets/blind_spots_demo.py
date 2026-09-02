"""Reproduce the two ``--params`` blind spots for the snapshot adapter (kedro >= 1.4).

Run from anywhere with the dev env active:

    conda activate viz-3-14
    python inspection-adapter-tickets/blind_spots_demo.py

Blind spot 1 — catalog templating: a dataset path templated on ``${runtime_params:...}``.
    Result: the snapshot is param-blind (resolves the default), while the live ``context.catalog``
    is param-aware. So the *pure snapshot* path can't reflect it; full mode's live bridge can.
    => REAL limitation for the snapshot-only / lite path.

Blind spot 2 — dynamic topology: does ``--params`` change the node/edge set?
    Result: on kedro >= 1.4 there is no supported way for ``--params`` to reach
    ``register_pipelines`` (``get_current_session`` was removed; the live loader also builds the
    graph from the param-blind global ``pipelines``). So topology is invariant for both engines.
    => NOT a blocker on kedro >= 1.4.
"""

import json
import tempfile
from pathlib import Path

from kedro_viz.api.inspection_adapter_provider import InspectionAdapterProvider
from kedro_viz.data_access.repositories import GraphNodesRepository
from kedro_viz.integrations.kedro import data_loader, node_ids
from kedro_viz.integrations.kedro.inspection import snapshot_source

REPO_ROOT = Path(__file__).resolve().parents[1]
DEMO = REPO_ROOT / "demo-project"


def _make_templated_project() -> Path:
    """A minimal project whose catalog filepath is templated on a runtime param."""
    root = Path(tempfile.mkdtemp())
    (root / "conf" / "base").mkdir(parents=True)
    (root / "conf" / "local").mkdir(parents=True)  # the config loader's default run env
    pkg = root / "src" / "proj_a"
    pkg.mkdir(parents=True)
    (root / "pyproject.toml").write_text(
        '[tool.kedro]\npackage_name = "proj_a"\nproject_name = "proj_a"\n'
        'kedro_init_version = "1.4.0"\n'
    )
    (root / "conf" / "base" / "catalog.yml").write_text(
        "templated_input:\n"
        "  type: pandas.CSVDataset\n"
        "  filepath: data/${runtime_params:version,01}/input.csv\n"
    )
    (root / "conf" / "base" / "parameters.yml").write_text("alpha: 1\n")
    (pkg / "__init__.py").write_text('__version__ = "0.1"\n')
    (pkg / "settings.py").write_text("")
    (pkg / "pipeline_registry.py").write_text(
        "from kedro.pipeline import node, pipeline\n"
        "def _p(x):\n    return x\n"
        "def register_pipelines():\n"
        "    return {'__default__': pipeline("
        "[node(_p, 'templated_input', 'output', name='p')])}\n"
    )
    return root


def blind_spot_1_catalog_templating() -> None:
    print("=" * 72)
    print("BLIND SPOT 1 — catalog templating (--params version=02)")
    print("=" * 72)
    proj = _make_templated_project()
    rp = {"version": "02"}

    # Pure snapshot path (empty bridge):
    adapter = InspectionAdapterProvider(
        proj, runtime_params=rp, live_nodes=GraphNodesRepository()
    )
    ds_id = node_ids.dataset_node_id("templated_input")
    adapter_fp = json.loads(adapter.get_node_metadata_response(ds_id).body).get("filepath")
    # What the live backend resolves (context.catalog is runtime-param aware):
    live_fp = snapshot_source.load_catalog_config(proj, runtime_params=rp)[
        "templated_input"
    ]["filepath"]

    print(f"  ADAPTER (snapshot)      filepath = {adapter_fp}")
    print(f"  LIVE  (context.catalog) filepath = {live_fp}")
    print(f"  => MATCH? {adapter_fp == live_fp}   (False => snapshot is param-blind)\n")


def blind_spot_2_dynamic_topology() -> None:
    print("=" * 72)
    print("BLIND SPOT 2 — does --params change the node set? (kedro >= 1.4)")
    print("=" * 72)

    def live_nodes(rp: dict | None) -> int:
        _, pipelines, _ = data_loader.load_data(DEMO, extra_params=rp)
        return sum(len(p.nodes) for p in pipelines.values())

    def adapter_nodes(rp: dict | None) -> int:
        provider = InspectionAdapterProvider(
            DEMO, runtime_params=rp, live_nodes=GraphNodesRepository()
        )
        return len(provider.get_pipeline_response().nodes)

    override = {"split_options": {"test_size": 0.99}}
    bl, ol = live_nodes(None), live_nodes(override)
    ba, oa = adapter_nodes(None), adapter_nodes(override)
    print(f"  LIVE    node count: base={bl}  with --params={ol}  changed? {bl != ol}")
    print(f"  ADAPTER node count: base={ba}  with --params={oa}  changed? {ba != oa}")
    print("  => neither changes: --params cannot alter topology on kedro >= 1.4.\n")


if __name__ == "__main__":
    blind_spot_1_catalog_templating()
    blind_spot_2_dynamic_topology()
