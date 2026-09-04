"""Parity between context services and captured legacy responses.

The baseline under ``baseline/`` was captured from the live backend before metadata helper
extraction. These compare graph and node-detail responses field for field. The context receives
explicit enrichment from a local live load, so no process-wide repository is involved. CLI
variants are covered by focused context, service, and ``GraphBuilder`` tests.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.encoders import jsonable_encoder

from kedro_viz.api.rest.responses.pipelines import GraphAPIResponse
from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro_viz.data_access import DataAccessManager
from kedro_viz.integrations.kedro.inspection import (
    EnrichmentSources,
    InspectionGraphService,
    VizProjectContext,
)
from kedro_viz.models.flowchart.model_utils import GraphNodeType

from .capture_baseline import normalize_graph, normalize_node_metadata

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


def _node_metadata_baseline() -> dict[str, dict]:
    return json.loads((BASELINE_DIR / "node_metadata.json").read_text(encoding="utf-8"))


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
def live_project_context(_restore_kedro_project_state) -> VizProjectContext:
    """Build one context enriched from an isolated live load of the demo project.

    Module-scoped: loading the demo project and reading the snapshot is expensive.
    """
    from kedro_viz.integrations.kedro import data_loader
    from kedro_viz.server import populate_data

    manager = DataAccessManager()
    catalog, pipelines, node_extras = data_loader.load_data(DEMO_PROJECT)
    populate_data(manager, catalog, pipelines, node_extras)
    live_nodes_by_id = manager.nodes.as_dict()
    enrichment = EnrichmentSources.from_live_nodes(live_nodes_by_id.values())
    return VizProjectContext.from_project(
        DEMO_PROJECT,
        enrichment=enrichment,
        node_extras_by_name=manager.node_extras,
        live_nodes_by_id=live_nodes_by_id,
    )


@pytest.fixture(scope="module")
def live_enriched_graph_service(
    live_project_context: VizProjectContext,
) -> InspectionGraphService:
    return live_project_context.graph


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


def test_node_metadata_matches_independently_captured_legacy_responses(
    live_project_context: VizProjectContext,
) -> None:
    """Every supported full-mode response matches the pre-helper legacy baseline."""
    expected_by_node_id = _node_metadata_baseline()
    graph_node_ids = {
        node.id
        for pipeline_id in PIPELINE_IDS
        for node in live_project_context.graph.get_pipeline_response(pipeline_id).nodes
        if node.type != GraphNodeType.MODULAR_PIPELINE.value
    }
    assert set(expected_by_node_id) == graph_node_ids

    for node_id, expected in expected_by_node_id.items():
        response = live_project_context.node_metadata.get_node_metadata_response(
            node_id
        )
        actual = normalize_node_metadata(jsonable_encoder(response, exclude_none=True))
        assert actual == expected, node_id
