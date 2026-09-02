"""Gate 1 — catalog templated on runtime params.

A minimal synthetic Kedro project with a dataset whose filepath uses ``${runtime_params:...}``.
This proves the boundary: the **snapshot** is param-blind (``get_project_snapshot`` takes no
runtime params, so it resolves the default), while the config loader we read ourselves **is**
param-aware. Consequence: the snapshot-built graph alone cannot reflect ``--params`` catalog
templating — in full mode the live bridge supplies the resolved value; in lite mode it is a
documented degradation (only a Kedro-side change would close it).

Its own test module so the synthetic project's Kedro bootstrap doesn't collide with the demo's
(the autouse ``_restore_kedro_project_state`` fixture restores global state per module).
"""

import textwrap
from pathlib import Path

import pytest

from kedro_viz.integrations.kedro.inspection import snapshot_source


@pytest.fixture(scope="module")
def rtp_project(tmp_path_factory: pytest.TempPathFactory) -> Path:
    """A minimal Kedro project whose catalog filepath is templated on a runtime param."""
    root = tmp_path_factory.mktemp("rtp_project")
    (root / "conf" / "base").mkdir(parents=True)
    (root / "conf" / "local").mkdir(parents=True)  # the config loader's default run env
    pkg = root / "src" / "rtp_project"
    pkg.mkdir(parents=True)

    (root / "pyproject.toml").write_text(
        textwrap.dedent(
            """
            [tool.kedro]
            package_name = "rtp_project"
            project_name = "rtp_project"
            kedro_init_version = "1.4.0"
            """
        ).strip()
        + "\n",
        encoding="utf-8",
    )
    (root / "conf" / "base" / "catalog.yml").write_text(
        textwrap.dedent(
            """
            templated_input:
              type: pandas.CSVDataset
              filepath: data/${runtime_params:version,01}/input.csv
            """
        ).strip()
        + "\n",
        encoding="utf-8",
    )
    (root / "conf" / "base" / "parameters.yml").write_text(
        "alpha: 1\n", encoding="utf-8"
    )

    (pkg / "__init__.py").write_text('__version__ = "0.1"\n', encoding="utf-8")
    (pkg / "settings.py").write_text("", encoding="utf-8")
    (pkg / "pipeline_registry.py").write_text(
        textwrap.dedent(
            """
            from kedro.pipeline import node, pipeline


            def _passthrough(x):
                return x


            def register_pipelines():
                pipe = pipeline(
                    [node(_passthrough, "templated_input", "output", name="passthrough")]
                )
                return {"__default__": pipe}
            """
        ).strip()
        + "\n",
        encoding="utf-8",
    )
    return root


def test_snapshot_is_param_blind_but_config_loader_is_param_aware(
    rtp_project: Path,
) -> None:
    snapshot = snapshot_source._InspectionSession(rtp_project).snapshot()
    snap_fp = str(snapshot.datasets["templated_input"].filepath)

    cfg_default = str(
        snapshot_source._InspectionSession(rtp_project).catalog_config()[
            "templated_input"
        ]["filepath"]
    )
    cfg_override = str(
        snapshot_source._InspectionSession(
            rtp_project, runtime_params={"version": "02"}
        ).catalog_config()["templated_input"]["filepath"]
    )

    # The snapshot resolves the template with the default — no runtime params reach it.
    assert "01" in snap_fp and "02" not in snap_fp
    # Our own config-loader read IS runtime-param aware.
    assert cfg_override.endswith("02/input.csv")
    # Default-resolved paths agree; the override is where the snapshot falls behind.
    assert cfg_default == snap_fp
    assert snap_fp != cfg_override
