"""Load file-backed node extras and enrich inspection graph responses."""

from __future__ import annotations

import json
import logging
from collections.abc import Iterable, Mapping
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field, field_validator

from kedro_viz.api.rest.responses.pipelines import (
    DataNodeAPIResponse,
    GraphAPIResponse,
    NodeExtrasAPIResponse,
)
from kedro_viz.constants import VIZ_METADATA_ARGS
from kedro_viz.models.flowchart.nodes import DataNode, GraphNode
from kedro_viz.models.metadata import NodeExtras

logger = logging.getLogger(__name__)


class EnrichmentSources(BaseModel, frozen=True):
    """Prepared file-backed and live enrichment for one project.

    File extras retain their names for snapshot metadata. Graph overlays retain the exact
    live node IDs and values, including any live-node selection of transcoded extras.
    No live nodes are retained.
    """

    node_extras_by_name: Mapping[str, NodeExtras] = Field(default_factory=dict)
    node_extras_by_node_id: Mapping[str, NodeExtras] = Field(default_factory=dict)
    dataset_type_by_node_id: Mapping[str, str | None] = Field(default_factory=dict)
    layer_by_dataset_name: Mapping[str, str] | None = None

    @field_validator(
        "node_extras_by_name",
        "node_extras_by_node_id",
        "dataset_type_by_node_id",
        "layer_by_dataset_name",
        mode="before",
    )
    @classmethod
    def _copy_mapping(cls, value: Mapping | None) -> dict | None:
        """Copy caller-owned mappings before storing them on the prepared model."""
        return None if value is None else dict(value)


def enrich_graph_response(
    response: GraphAPIResponse, sources: EnrichmentSources
) -> None:
    """Mutate live-only response fields without adding, removing or renaming nodes."""
    for node in response.nodes:
        node_extras = sources.node_extras_by_node_id.get(node.id)
        if node_extras is not None:
            node.node_extras = NodeExtrasAPIResponse(
                stats=node_extras.stats,
                styles=node_extras.styles,
            )
        if (
            isinstance(node, DataNodeAPIResponse)
            and node.id in sources.dataset_type_by_node_id
        ):
            node.dataset_type = sources.dataset_type_by_node_id[node.id]


def _read_and_validate_json(
    file_path: Path,
    file_type: str,
    project_path: Path,
    fallback_message: str,
) -> dict[str, Any]:
    """Read a JSON object, returning an empty mapping when it cannot be used."""
    try:
        with open(file_path, encoding="utf8") as json_file:
            data = json.load(json_file)

            if not isinstance(data, dict):
                logger.warning(
                    "Invalid data format in %s at project path %s. "
                    "Expected a JSON object (dictionary), got %s. "
                    "Please ensure %s contains a valid JSON object.",
                    file_type,
                    project_path,
                    type(data).__name__,
                    file_type,
                )
                return {}

            return data

    except json.JSONDecodeError as exc:
        logger.warning(
            "Invalid JSON format in %s at project path %s. "
            "Error at line %s, column %s: %s. "
            "Please check your %s file for syntax errors.",
            file_type,
            project_path,
            exc.lineno,
            exc.colno,
            exc.msg,
            file_type,
        )
        return {}
    except FileNotFoundError:
        logger.debug("%s not found at %s", file_type, file_path)
        return {}
    except PermissionError as exc:
        logger.warning(
            "Permission denied accessing %s at project path %s: %s. "
            "Please check file permissions.",
            file_type,
            project_path,
            exc,
        )
        return {}
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "Issue in reading %s at project path %s: %s. %s",
            file_type,
            project_path,
            exc,
            fallback_message,
        )
        return {}


def _get_dataset_stats(project_path: Path) -> dict[str, Any]:
    """Return the contents of ``.viz/stats.json``, or an empty mapping."""
    stats_file_path = project_path / f"{VIZ_METADATA_ARGS['path']}/stats.json"
    return _read_and_validate_json(
        file_path=stats_file_path,
        file_type="stats.json",
        project_path=project_path,
        fallback_message="Kedro-Viz will continue without dataset statistics.",
    )


def _get_node_styles(project_path: Path) -> dict[str, Any]:
    """Return the contents of ``.viz/styles.json``, or an empty mapping."""
    styles_file_path = project_path / f"{VIZ_METADATA_ARGS['path']}/styles.json"
    return _read_and_validate_json(
        file_path=styles_file_path,
        file_type="styles.json",
        project_path=project_path,
        fallback_message="Kedro-Viz will continue without node styling.",
    )


def load_enrichment_sources(
    project_path: str | Path,
    *,
    nodes: Iterable[GraphNode] = (),
    node_extras_by_name: Mapping[str, NodeExtras] | None = None,
    layer_by_dataset_name: Mapping[str, str] | None = None,
) -> EnrichmentSources:
    """Prepare enrichment once, reusing file extras when the live load supplied them.

    An explicit empty extras mapping skips file reads. Live graph overlays are copied by
    their existing IDs; they do not replace the name-keyed file values used by metadata.
    Layers are supplied by the caller, preserving the distinction between absent and empty.
    """
    if node_extras_by_name is None:
        stats_by_name = _get_dataset_stats(Path(project_path))
        styles_by_name = _get_node_styles(Path(project_path))
        file_extras: dict[str, NodeExtras] = {}
        for node_name in stats_by_name.keys() | styles_by_name.keys():
            node_extras = NodeExtras.create_node_extras(
                stats=stats_by_name.get(node_name),
                styles=styles_by_name.get(node_name),
            )
            if node_extras is not None:
                file_extras[node_name] = node_extras
        node_extras_by_name = file_extras

    node_extras_by_node_id: dict[str, NodeExtras] = {}
    dataset_type_by_node_id: dict[str, str | None] = {}
    for node in nodes:
        if node.node_extras is not None:
            node_extras_by_node_id[node.id] = node.node_extras
        if isinstance(node, DataNode):
            dataset_type_by_node_id[node.id] = node.dataset_type
    return EnrichmentSources(
        node_extras_by_name=node_extras_by_name,
        node_extras_by_node_id=node_extras_by_node_id,
        dataset_type_by_node_id=dataset_type_by_node_id,
        layer_by_dataset_name=layer_by_dataset_name,
    )
