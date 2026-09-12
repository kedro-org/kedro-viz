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

from kedro_viz.api.rest.responses.pipelines import GraphAPIResponse
from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro_viz.data_access import DataAccessManager
from kedro_viz.integrations.kedro.inspection import VizProjectContext
from kedro_viz.integrations.kedro.inspection.enrichment import load_enrichment_sources
from kedro_viz.integrations.kedro.inspection.graph_service import GraphService
from kedro_viz.models.flowchart.model_utils import GraphNodeType

from .capture_baseline import normalize_graph
from .capture_node_metadata_baseline import (
    NODE_METADATA_BASELINE_SOURCE_COMMIT,
    normalize_node_metadata,
)
from .metadata_parity_project import GENERATED_TABLES, prepare_metadata_parity_project

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
    report = json.loads(
        (BASELINE_DIR / "node_metadata.json").read_text(encoding="utf-8")
    )
    assert report["captured_from_commit"] == NODE_METADATA_BASELINE_SOURCE_COMMIT
    return report["responses"]


@pytest.mark.parametrize(
    "filepath",
    [
        f"{DEMO_PROJECT.as_posix()}/src/project/nodes.py",
        "demo-project/src/project/nodes.py",
        "kedro-viz/demo-project/src/project/nodes.py",
    ],
)
def test_node_metadata_path_normalization_is_working_directory_independent(
    filepath: str,
) -> None:
    response = normalize_node_metadata({"filepath": filepath})

    assert response["filepath"] == "<DEMO_PROJECT>/src/project/nodes.py"


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
def parity_project(tmp_path_factory) -> Path:
    return prepare_metadata_parity_project(
        DEMO_PROJECT, tmp_path_factory.mktemp("metadata-parity") / "demo-project"
    )


def test_parity_project_ignores_generated_data_and_unpinned_versions(
    parity_project, tmp_path
):
    source = prepare_metadata_parity_project(parity_project, tmp_path / "source")
    for relative_path in GENERATED_TABLES:
        (source / "data" / relative_path).write_bytes(b"local pipeline output")
    extra_version = (
        source / "data/08_reporting/price_histogram.json/2099-01-01T00.00.00.000Z"
    )
    extra_version.mkdir()
    (extra_version / "price_histogram.json").write_text("{}", encoding="utf-8")

    isolated = prepare_metadata_parity_project(source, tmp_path / "isolated")

    for relative_path in GENERATED_TABLES:
        assert (isolated / "data" / relative_path).read_bytes() == (
            parity_project / "data" / relative_path
        ).read_bytes()
    assert not (isolated / extra_version.relative_to(source)).exists()


@pytest.fixture(scope="module")
def live_project_context(
    _restore_kedro_project_state, parity_project
) -> VizProjectContext:
    """Build one context enriched from an isolated live load of the demo project.

    Module-scoped: loading the demo project and reading the snapshot is expensive.
    """
    from kedro_viz.integrations.kedro import data_loader
    from kedro_viz.server import populate_data

    manager = DataAccessManager()
    catalog, pipelines, node_extras = data_loader.load_data(parity_project)
    populate_data(manager, catalog, pipelines, node_extras)
    live_nodes_by_id = manager.nodes.as_dict()
    enrichment = load_enrichment_sources(
        parity_project,
        nodes=live_nodes_by_id.values(),
        node_extras_by_name=manager.node_extras,
    )
    return VizProjectContext.from_project(
        parity_project,
        enrichment=enrichment,
        live_nodes_by_id=live_nodes_by_id,
    )


@pytest.fixture(scope="module")
def live_enriched_graph_service(
    live_project_context: VizProjectContext,
) -> GraphService:
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


def test_node_metadata_baseline_covers_every_metadata_node_and_all_previews(
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
    assert len(expected_by_node_id) == 57
    assert sum("preview" in response for response in expected_by_node_id.values()) == 16


@pytest.mark.parametrize("node_id,expected", sorted(_node_metadata_baseline().items()))
def test_node_metadata_matches_independently_captured_legacy_responses(
    live_project_context: VizProjectContext,
    node_id: str,
    expected: dict,
) -> None:
    """Each complete response, including its preview, matches the legacy backend."""
    response = live_project_context.nodes.get_node_metadata_response(node_id)
    actual = normalize_node_metadata(
        response.model_dump(mode="json", exclude_none=True)
    )
    assert actual == expected, node_id
