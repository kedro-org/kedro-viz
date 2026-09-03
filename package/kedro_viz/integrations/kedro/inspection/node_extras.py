"""Load file-backed Kedro-Viz node extras without constructing a catalog."""

import json
import logging
from pathlib import Path
from typing import Any

from kedro_viz.constants import VIZ_METADATA_ARGS
from kedro_viz.models.metadata import NodeExtras

logger = logging.getLogger(__name__)


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


def load_node_extras(project_path: Path) -> dict[str, NodeExtras]:
    """Load stats and styles into one name-keyed mapping."""
    stats_by_name = _get_dataset_stats(project_path)
    styles_by_name = _get_node_styles(project_path)
    node_extras_by_name: dict[str, NodeExtras] = {}

    for node_name in stats_by_name.keys() | styles_by_name.keys():
        node_extras = NodeExtras.create_node_extras(
            stats=stats_by_name.get(node_name),
            styles=styles_by_name.get(node_name),
        )
        if node_extras is not None:
            node_extras_by_name[node_name] = node_extras

    return node_extras_by_name
