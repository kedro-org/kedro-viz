"""Real-project parity for snapshot-owned metadata, without dataset output files.

Legacy responses supply the expectations independently of the inspection builders.
Live-only source and preview fields are outside this layer's static contract; complete
live-response and HTTP parity are covered in the later stack layers.
"""

from pathlib import Path
from shutil import copytree, ignore_patterns

import pytest
from kedro.io.core import parse_dataset_definition
from kedro.pipeline.node import Node
from pydantic import TypeAdapter

from kedro_viz.api.rest.responses import nodes as legacy_responses
from kedro_viz.api.rest.responses.nodes import (
    DataNodeMetadataAPIResponse,
    NodeMetadataAPIResponse,
    ParametersNodeMetadataAPIResponse,
    TaskNodeMetadataAPIResponse,
    TranscodedDataNodeMetadataAPIReponse,
)
from kedro_viz.constants import MEMORY_DATASET_TYPE
from kedro_viz.data_access import DataAccessManager
from kedro_viz.integrations.kedro import data_loader
from kedro_viz.integrations.kedro.inspection.graph_service import GraphService
from kedro_viz.integrations.kedro.inspection.node_metadata_service import (
    NodeMetadataService,
)
from kedro_viz.integrations.kedro.inspection.snapshot_source import (
    load_inspection_inputs,
)
from kedro_viz.models.flowchart.node_metadata import (
    DataNodeMetadata,
    ParametersNodeMetadata,
    TaskNodeMetadata,
    TranscodedDataNodeMetadata,
)
from kedro_viz.models.flowchart.nodes import GraphNodeType
from kedro_viz.server import populate_data

DEMO_PROJECT = Path(__file__).resolve().parents[3] / "demo-project"

# Explicit partitions keep schema additions from silently escaping the comparison.
STATIC_FIELDS = {
    TaskNodeMetadataAPIResponse: {"parameters", "inputs", "outputs", "run_command"},
    DataNodeMetadataAPIResponse: {"filepath", "type", "stats", "run_command"},
    TranscodedDataNodeMetadataAPIReponse: {
        "filepath",
        "original_type",
        "transcoded_types",
        "stats",
        "run_command",
    },
    ParametersNodeMetadataAPIResponse: {"parameters"},
}
LIVE_FIELDS = {
    TaskNodeMetadataAPIResponse: {"code", "filepath", "preview"},
    DataNodeMetadataAPIResponse: {"preview", "preview_type"},
    TranscodedDataNodeMetadataAPIReponse: set(),
    ParametersNodeMetadataAPIResponse: set(),
}


def _resolved_static_metadata(response, project):
    """Resolve config aliases/paths to the representation exposed by live datasets.

    This is only a semantic comparison at the snapshot-only boundary. Exact live
    response strings remain the responsibility of the later enrichment parity test.
    """
    result = response.model_dump(mode="json", include=STATIC_FIELDS[type(response)])
    if result.get("filepath") is not None:
        result["filepath"] = str((project / result["filepath"]).resolve())

    def resolve_type(name):
        if name == MEMORY_DATASET_TYPE:
            return name
        dataset_class, _ = parse_dataset_definition({"type": name})
        module = ".".join(dataset_class.__module__.split(".")[-2:])
        return f"{module}.{dataset_class.__qualname__}"

    for key in ("type", "original_type"):
        if key in result:
            result[key] = resolve_type(result[key])
    if "transcoded_types" in result:
        result["transcoded_types"] = [
            resolve_type(name) for name in result["transcoded_types"]
        ]
    return result


@pytest.fixture(scope="module")
def live_metadata_service(tmp_path_factory, _restore_kedro_project_state):
    """Compare independent live and inspection loads of the same data-free project."""
    project = tmp_path_factory.mktemp("static-metadata") / "demo-project"
    copytree(
        DEMO_PROJECT,
        project,
        ignore=ignore_patterns("data", "__pycache__", ".git", ".venv"),
    )
    assert not (project / "data").exists()
    manager = DataAccessManager()
    catalog, pipelines, extras = data_loader.load_data(project)
    populate_data(manager, catalog, pipelines, extras)
    inputs = load_inspection_inputs(project)
    service = NodeMetadataService.from_inspection_inputs(
        inputs, enrichment=manager.node_extras
    )
    graph = GraphService.from_inspection_inputs(inputs)

    with pytest.MonkeyPatch.context() as patch:
        patch.setattr(legacy_responses, "data_access_manager", manager)
        patch.setattr(DataNodeMetadata, "is_all_previews_enabled", False)
        patch.setattr(Node, "preview", lambda self: None)
        # The pre-helper legacy validators store request objects on their classes.
        # Restore those attributes too, including removing ones initially absent.
        for model, names in (
            (TaskNodeMetadata, ("task_node", "kedro_node")),
            (DataNodeMetadata, ("data_node", "dataset")),
            (TranscodedDataNodeMetadata, ("transcoded_data_node",)),
            (ParametersNodeMetadata, ("parameters_node",)),
        ):
            for name in names:
                patch.setattr(model, name, getattr(model, name, None), raising=False)
        adapter = TypeAdapter(NodeMetadataAPIResponse)
        expected = {
            node.id: adapter.validate_python(
                legacy_responses.get_node_metadata_response(node.id)
            )
            for node in manager.nodes.as_list()
            if node.has_metadata()
        }

    graph_ids = {
        node.id
        for pipeline in inputs.snapshot.pipelines
        for node in graph.get_pipeline_response(pipeline.name).nodes
        if node.type != GraphNodeType.MODULAR_PIPELINE.value
    }
    return service, expected, graph_ids, project


def test_static_metadata_parity_covers_every_supported_demo_node(live_metadata_service):
    _, expected, graph_ids, _ = live_metadata_service
    assert set(expected) == graph_ids
    assert len(expected) == 57
    assert {type(response) for response in expected.values()} == set(STATIC_FIELDS)


@pytest.mark.parametrize(
    "response_type", STATIC_FIELDS, ids=lambda model: model.__name__
)
def test_static_metadata_matches_live_legacy_fields(
    live_metadata_service, response_type
):
    service, expected, _, project = live_metadata_service
    fields = STATIC_FIELDS[response_type]
    live_fields = LIVE_FIELDS[response_type]
    assert set(response_type.model_fields) == fields | live_fields
    assert not fields & live_fields

    for node_id, legacy in expected.items():
        if type(legacy) is not response_type:
            continue
        actual = service.get_node_metadata_response(node_id)
        assert type(actual) is response_type, node_id
        # Keep None values: an absent static value must not disappear from parity.
        assert _resolved_static_metadata(actual, project) == legacy.model_dump(
            mode="json", include=fields
        ), node_id
        assert all(getattr(actual, field) is None for field in live_fields), node_id


def test_static_resolution_preserves_dataset_identity_and_path(tmp_path):
    configured = DataNodeMetadataAPIResponse(
        type="pandas.CSVDataset", filepath="data//input.csv"
    )
    resolved = _resolved_static_metadata(configured, tmp_path)
    assert resolved == {
        "type": "pandas.csv_dataset.CSVDataset",
        "filepath": str(tmp_path / "data/input.csv"),
        "stats": None,
        "run_command": None,
    }
    other_type = configured.model_copy(update={"type": "pandas.ParquetDataset"})
    other_path = configured.model_copy(update={"filepath": "data/other.csv"})
    assert _resolved_static_metadata(other_type, tmp_path) != resolved
    assert _resolved_static_metadata(other_path, tmp_path) != resolved
