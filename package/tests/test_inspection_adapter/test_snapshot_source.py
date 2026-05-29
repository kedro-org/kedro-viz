"""Tests for the inspection snapshot source.

The load test requires the inspection API (``kedro>=1.4.0``) and is skipped otherwise.
"""

from pathlib import Path

import pytest

from kedro_viz.integrations.kedro.inspection import snapshot_source

DEMO_PROJECT = Path(__file__).resolve().parents[3] / "demo-project"


def test_is_inspection_available_returns_bool() -> None:
    assert isinstance(snapshot_source.is_inspection_available(), bool)


@pytest.mark.skipif(
    not snapshot_source.is_inspection_available(),
    reason="kedro inspection API unavailable (requires kedro>=1.4.0)",
)
def test_load_snapshot_returns_demo_pipelines() -> None:
    snapshot = snapshot_source.load_snapshot(DEMO_PROJECT)
    pipeline_names = {pipeline.name for pipeline in snapshot.pipelines}
    assert "__default__" in pipeline_names
