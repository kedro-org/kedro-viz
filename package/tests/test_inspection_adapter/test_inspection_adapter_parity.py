"""Parity between the served graph and the captured legacy response.

The baseline under ``baseline/`` was captured from the live backend, so these compare the whole
served response against it, field for field, for every registered pipeline. The service receives
explicit enrichment from a local live load, so no process-wide repository is involved.
This suite covers the normal live-load response; CLI variants are covered by focused context,
service and ``GraphBuilder`` tests.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from kedro_viz.api.rest.responses.pipelines import GraphAPIResponse
from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro_viz.data_access import DataAccessManager
from kedro_viz.integrations.kedro.inspection import (
    EnrichmentSources,
    InspectionGraphService,
)

from .capture_baseline import normalize_graph

DEMO_PROJECT = Path(__file__).resolve().parents[3] / "demo-project"
BASELINE_DIR = Path(__file__).parent / "baseline"
PIPELINE_IDS = [
    "__default__",
    "data_ingestion",
    "feature_engineering",
    "modelling_stage",
    "pre_modelling",
    "reporting_stage",
]

# The captured demo response lists ``params:split_options`` twice under ``__root__``:
# once as data and once as parameters. The adapter correctly emits one parameter child, so
# normalize only the expected baseline rather than excusing the served response.
_KNOWN_DUPLICATE_ROOT_CHILD = {"id": "22eec376", "type": "data"}
_KNOWN_PARAMETER_ROOT_CHILD = {"id": "22eec376", "type": "parameters"}


def _baseline(pipeline_id: str) -> dict:
    name = "main" if pipeline_id == "__default__" else pipeline_id
    path = BASELINE_DIR / ("main.json" if name == "main" else f"pipelines/{name}.json")
    return json.loads(path.read_text(encoding="utf-8"))


def _normalize_expected_graph(graph: dict) -> dict:
    """Normalize the baseline and remove its one documented duplicate root child."""
    normalized = normalize_graph(graph)
    root_children = normalized["modular_pipelines"][ROOT_MODULAR_PIPELINE_ID][
        "children"
    ]
    if _KNOWN_DUPLICATE_ROOT_CHILD in root_children:
        assert _KNOWN_PARAMETER_ROOT_CHILD in root_children
        root_children.remove(_KNOWN_DUPLICATE_ROOT_CHILD)
    return normalized


@pytest.fixture(scope="module")
def live_enriched_graph_service(_restore_kedro_project_state):
    """A graph service enriched from an isolated live load of the demo project.

    Module-scoped: loading the demo project and reading the snapshot is expensive.
    """
    from kedro_viz.integrations.kedro import data_loader
    from kedro_viz.server import populate_data

    manager = DataAccessManager()
    catalog, pipelines, node_extras = data_loader.load_data(DEMO_PROJECT)
    populate_data(manager, catalog, pipelines, node_extras)
    enrichment = EnrichmentSources.from_live_nodes(manager.nodes.as_list())
    return InspectionGraphService.from_project(DEMO_PROJECT, enrichment=enrichment)


@pytest.mark.parametrize("pipeline_id", PIPELINE_IDS)
def test_served_graph_matches_the_baseline_after_live_enrichment(
    live_enriched_graph_service, pipeline_id: str
) -> None:
    """The complete snapshot graph plus live-only fields matches the captured response.

    A wrong ID, dataset type, task parameter, node extra or structural field fails here.
    """
    response = live_enriched_graph_service.get_pipeline_response(pipeline_id)
    assert isinstance(response, GraphAPIResponse)
    expected = _normalize_expected_graph(_baseline(pipeline_id))
    served = normalize_graph(response.model_dump(mode="json"))

    if pipeline_id == "__default__":
        assert any(
            node.get("parameters")
            for node in expected["nodes"]
            if node["type"] == "task"
        ), "the baseline should exercise parameters"

    assert served == expected, pipeline_id
