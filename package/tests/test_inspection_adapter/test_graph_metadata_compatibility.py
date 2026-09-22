"""Compatibility between inspection graphs and legacy node-detail routes."""

from pathlib import Path
from shutil import copytree, ignore_patterns

import pytest
from fastapi.testclient import TestClient
from kedro.pipeline.node import Node

from kedro_viz.api import apps
from kedro_viz.api.rest.responses import nodes as legacy_responses
from kedro_viz.data_access import DataAccessManager
from kedro_viz.integrations.kedro import data_loader
from kedro_viz.integrations.kedro.inspection import VizProjectContext
from kedro_viz.integrations.kedro.inspection.enrichment import load_enrichment_sources
from kedro_viz.models.flowchart.node_metadata import DataNodeMetadata
from kedro_viz.server import populate_data

DEMO_PROJECT = Path(__file__).resolve().parents[3] / "demo-project"


@pytest.mark.parametrize("is_lite", [False, True], ids=["full", "lite"])
def test_inspection_graph_ids_resolve_through_legacy_metadata(
    tmp_path, monkeypatch, is_lite
):
    """Every supported graph node resolves without relying on generated dataset files."""
    project = tmp_path / "demo-project"
    copytree(
        DEMO_PROJECT,
        project,
        ignore=ignore_patterns("data", "__pycache__", ".git", ".venv"),
    )
    manager = DataAccessManager()
    catalog, pipelines, extras = data_loader.load_data(
        project, package_name="demo_project", is_lite=is_lite
    )
    populate_data(manager, catalog, pipelines, extras)
    enrichment = load_enrichment_sources(project, node_extras_by_name=extras)
    context = VizProjectContext.from_project(
        project, package_name="demo_project", is_lite=is_lite, enrichment=enrichment
    )
    monkeypatch.setattr(legacy_responses, "data_access_manager", manager)
    monkeypatch.setattr(DataNodeMetadata, "is_all_previews_enabled", False)
    monkeypatch.setattr(Node, "preview", lambda self: None)

    with TestClient(apps.create_api_app_from_project(context, project)) as client:
        main = client.get("/api/main")
        assert main.status_code == 200
        graph_ids = set()
        for pipeline in main.json()["pipelines"]:
            graph = client.get(f"/api/pipelines/{pipeline['id']}")
            assert graph.status_code == 200
            for node in graph.json()["nodes"]:
                if node["type"] == "modularPipeline":
                    continue
                graph_ids.add(node["id"])
                response = client.get(f"/api/nodes/{node['id']}")
                assert response.status_code == 200, node
                metadata = response.json()
                if node["type"] == "task":
                    assert metadata["parameters"] == node["parameters"]
                    assert "inputs" in metadata and "outputs" in metadata
                elif node["type"] == "parameters":
                    assert "parameters" in metadata
                else:
                    assert "type" in metadata or "original_type" in metadata

        expected_ids = {
            node.id for node in manager.nodes.as_list() if node.has_metadata()
        }
        assert graph_ids == expected_ids
        assert len(graph_ids) == 57
        missing = client.get("/api/nodes/unknown")
        assert missing.status_code == 404
        assert missing.json() == {"message": "Invalid node ID"}
