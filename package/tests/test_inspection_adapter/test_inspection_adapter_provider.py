"""Direct tests for :class:`InspectionAdapterProvider` (Phase 6.2b).

These run *without* FastAPI: build the provider from the demo project and assert the response
shape, default-pipeline behaviour, 404 branch, and the ``pipeline_name`` (``--pipeline``) filter.
"""

import json
from pathlib import Path

import pytest
from fastapi.responses import JSONResponse

from kedro_viz.api.inspection_adapter_provider import InspectionAdapterProvider
from kedro_viz.api.rest.responses.pipelines import GraphAPIResponse
from kedro_viz.integrations.kedro.inspection import snapshot_source

REPO_ROOT = Path(__file__).resolve().parents[3]
DEMO_PROJECT = REPO_ROOT / "demo-project"
BASELINE_DIR = Path(__file__).parent / "baseline"

pytestmark = pytest.mark.skipif(
    not snapshot_source.is_inspection_available(),
    reason="kedro inspection API unavailable (requires kedro>=1.4.0)",
)


def _baseline(pipeline_id: str) -> dict:
    name = "main" if pipeline_id == "__default__" else pipeline_id
    path = BASELINE_DIR / ("main.json" if name == "main" else f"pipelines/{name}.json")
    return json.loads(path.read_text(encoding="utf-8"))


def _names(nodes: list[dict], node_type: str) -> set[str]:
    key = "full_name" if node_type == "task" else "name"
    return {n[key] for n in nodes if n["type"] == node_type}


@pytest.fixture(scope="module")
def provider(_restore_kedro_project_state) -> InspectionAdapterProvider:
    # Module-scoped because constructing the provider bootstraps Kedro + loads the snapshot once.
    return InspectionAdapterProvider(DEMO_PROJECT)


@pytest.fixture(scope="module")
def provider_scoped(_restore_kedro_project_state) -> InspectionAdapterProvider:
    return InspectionAdapterProvider(DEMO_PROJECT, pipeline_name="modelling_stage")


# -- default behaviour ------------------------------------------------------------------------- #


def _as_graph(result: object) -> dict:
    """Narrow the ``GraphAPIResponse | JSONResponse`` union to a dict for assertions."""
    assert isinstance(result, GraphAPIResponse), (
        f"expected GraphAPIResponse, got {type(result)}"
    )
    return result.model_dump()


def test_default_pipeline_response_matches_baseline_structurally(
    provider: InspectionAdapterProvider,
) -> None:
    response = _as_graph(provider.get_pipeline_response())
    baseline = _baseline("__default__")
    assert response["selected_pipeline"] == "__default__"
    assert _names(response["nodes"], "task") == _names(baseline["nodes"], "task")
    assert _names(response["nodes"], "data") == _names(baseline["nodes"], "data")


def test_get_pipeline_response_for_named_pipeline(
    provider: InspectionAdapterProvider,
) -> None:
    response = _as_graph(provider.get_pipeline_response("modelling_stage"))
    baseline = _baseline("modelling_stage")
    assert response["selected_pipeline"] == "modelling_stage"
    assert _names(response["nodes"], "task") == _names(baseline["nodes"], "task")


def test_unknown_pipeline_returns_404(provider: InspectionAdapterProvider) -> None:
    result = provider.get_pipeline_response("does_not_exist")
    assert isinstance(result, JSONResponse)
    assert result.status_code == 404


# -- --pipeline filter (D11 acceptance: `kedro viz run --pipeline X` honoured) ---------------- #


def test_pipeline_name_filter_defaults_to_that_pipeline(
    provider_scoped: InspectionAdapterProvider,
) -> None:
    response = _as_graph(provider_scoped.get_pipeline_response())
    assert response["selected_pipeline"] == "modelling_stage"
    # Only the scoped pipeline is registered (mirrors live --pipeline behaviour).
    assert [p["id"] for p in response["pipelines"]] == ["modelling_stage"]


def test_pipeline_name_filter_returns_404_for_other_pipelines(
    provider_scoped: InspectionAdapterProvider,
) -> None:
    # __default__ exists in the unfiltered snapshot, but is invisible under the --pipeline scope.
    result = provider_scoped.get_pipeline_response("__default__")
    assert isinstance(result, JSONResponse)
    assert result.status_code == 404


def test_pipeline_name_filter_rejects_unknown_name() -> None:
    with pytest.raises(ValueError, match="not found in snapshot"):
        InspectionAdapterProvider(DEMO_PROJECT, pipeline_name="not_a_pipeline")
