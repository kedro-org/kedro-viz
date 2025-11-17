"""`kedro_viz.integrations.kedro.data_loader` provides interface to
load data from a Kedro project. It takes care of making sure viz can
load data from projects created in a range of Kedro versions.
"""

import json
import logging
import sys
from pathlib import Path
from typing import Any, Dict, Optional, Set, Tuple
from unittest.mock import patch

from kedro import __version__
from kedro.framework.project import configure_project, pipelines
from kedro.framework.session import KedroSession
from kedro.framework.startup import bootstrap_project
from kedro.io import DataCatalog
from kedro.pipeline import Pipeline

from kedro_viz.constants import VIZ_METADATA_ARGS
from kedro_viz.integrations.kedro.abstract_dataset_lite import AbstractDatasetLite
from kedro_viz.integrations.kedro.lite_parser import LiteParser
from kedro_viz.integrations.utils import _VizNullPluginManager
from kedro_viz.models.metadata import Metadata, NodeExtras

logger = logging.getLogger(__name__)


def _read_and_validate_json(
    file_path: Path, file_type: str, project_path: Path, fallback_message: str
) -> Dict:
    """Read and validate a JSON file, returning a dictionary.

    Args:
        file_path: Path to the JSON file to read
        file_type: Type of file for logging (e.g., "stats.json", "styles.json")
        project_path: Project path for logging context
        fallback_message: Message to log when falling back to empty dict

    Returns:
        Dictionary containing the JSON data, or empty dict if file cannot be read/parsed
    """
    try:
        with open(file_path, encoding="utf8") as json_file:
            data = json.load(json_file)

            # Validate that the loaded JSON is a dictionary
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


def _get_dataset_stats(project_path: Path) -> Dict:
    """Return the stats saved at stats.json as a dictionary if found.
    If not, return an empty dictionary

    Args:
        project_path: the path where the Kedro project is located.
    """
    stats_file_path = project_path / f"{VIZ_METADATA_ARGS['path']}/stats.json"
    return _read_and_validate_json(
        file_path=stats_file_path,
        file_type="stats.json",
        project_path=project_path,
        fallback_message="Kedro-Viz will continue without dataset statistics.",
    )


def _get_node_styles(project_path: Path) -> Dict:
    """Return the styles saved at styles.json as a dictionary if found.
    If not, return an empty dictionary

    Args:
        project_path: the path where the Kedro project is located.
    """
    styles_file_path = project_path / f"{VIZ_METADATA_ARGS['path']}/styles.json"
    return _read_and_validate_json(
        file_path=styles_file_path,
        file_type="styles.json",
        project_path=project_path,
        fallback_message="Kedro-Viz will continue without node styling.",
    )


def _create_node_extras_mapping(project_path: Path) -> Dict[str, NodeExtras]:
    """Create a mapping from node names to NodeExtras objects.

    Args:
        project_path: the path where the Kedro project is located.

    Returns:
        Dictionary mapping node names to NodeExtras objects
    """

    stats_dict = _get_dataset_stats(project_path)
    styles_dict = _get_node_styles(project_path)
    node_extras_map = {}

    # Get all unique node names from both stats and styles
    all_node_names = set(stats_dict.keys()) | set(styles_dict.keys())

    # Create NodeExtras objects for each node
    for node_name in all_node_names:
        stats = stats_dict.get(node_name)
        styles = styles_dict.get(node_name)

        node_extras = NodeExtras.create_node_extras(stats=stats, styles=styles)

        if node_extras:
            node_extras_map[node_name] = node_extras

    return node_extras_map


def _load_data_helper(
    project_path: Path,
    env: Optional[str] = None,
    include_hooks: bool = False,
    extra_params: Optional[Dict[str, Any]] = None,
    is_lite: bool = False,
):
    """Helper to load data from a Kedro project.

    Args:
        project_path: the path where the Kedro project is located.
        env: the Kedro environment to load the data. If not provided.
            it will use Kedro default, which is local.
        include_hooks: A flag to include all registered hooks in your Kedro Project.
        extra_params: Optional dictionary containing extra project parameters
            for underlying KedroContext. If specified, will update (and therefore
            take precedence over) the parameters retrieved from the project
            configuration.
        is_lite: A flag to run Kedro-Viz in lite mode.
    Returns:
        A tuple containing the data catalog, pipeline and NodeExtras dictionary.
    """

    kedro_session = KedroSession.create(
        project_path=project_path,
        save_on_close=False,
        env=env,
        runtime_params=extra_params,
    )

    with kedro_session as session:
        # check for --include-hooks option
        if not include_hooks:
            session._hook_manager = _VizNullPluginManager()  # type: ignore

        context = session.load_context()

        # If user wants lite, we patch AbstractDatasetLite no matter what
        if is_lite:
            abstract_ds_patch_target = "kedro.io.data_catalog.AbstractDataset"

            with patch(abstract_ds_patch_target, AbstractDatasetLite):
                catalog = context.catalog
        else:
            catalog = context.catalog

        # Pipelines is a lazy dict-like object, so we force it to populate here
        # in case user doesn't have an active session down the line when it's first accessed.
        # Useful for users who have `get_current_session` in their `register_pipelines()`.
        pipelines_dict = dict(pipelines)
        node_extras = _create_node_extras_mapping(project_path)

    return catalog, pipelines_dict, node_extras


def load_data(
    project_path: Path,
    env: Optional[str] = None,
    include_hooks: bool = False,
    package_name: Optional[str] = None,
    extra_params: Optional[Dict[str, Any]] = None,
    is_lite: bool = False,
) -> Tuple[DataCatalog, Dict[str, Pipeline], Dict[str, NodeExtras]]:
    """Load data from a Kedro project.
    Args:
        project_path: the path where the Kedro project is located.
        env: the Kedro environment to load the data. If not provided.
            it will use Kedro default, which is local.
        include_hooks: A flag to include all registered hooks in your Kedro Project.
        package_name: The name of the current package
        extra_params: Optional dictionary containing extra project parameters
            for underlying KedroContext. If specified, will update (and therefore
            take precedence over) the parameters retrieved from the project
            configuration.
        is_lite: A flag to run Kedro-Viz in lite mode.
    Returns:
        A tuple containing the data catalog, pipeline and NodeExtras dictionary.

    """
    if package_name:
        configure_project(package_name)
    else:
        # bootstrap project when viz is run in dev mode
        bootstrap_project(project_path)

    if is_lite:
        lite_parser = LiteParser(package_name)
        unresolved_imports = lite_parser.parse(project_path)
        sys_modules_patch = sys.modules.copy()

        if unresolved_imports and len(unresolved_imports) > 0:
            modules_to_mock: Set[str] = set()

            # for the viz lite banner
            Metadata.set_has_missing_dependencies(True)

            for unresolved_module_set in unresolved_imports.values():
                modules_to_mock = modules_to_mock.union(unresolved_module_set)

            mocked_modules = lite_parser.create_mock_modules(modules_to_mock)
            sys_modules_patch.update(mocked_modules)

            logger.warning(
                "Kedro-Viz is running with limited functionality. "
                "For the best experience with full functionality, please\n"
                "install the missing Kedro project dependencies:\n"
                "%s \n",
                list(mocked_modules.keys()),
            )

        # Patch actual sys modules
        with patch.dict("sys.modules", sys_modules_patch):
            return _load_data_helper(
                project_path, env, include_hooks, extra_params, is_lite
            )
    else:
        return _load_data_helper(
            project_path, env, include_hooks, extra_params, is_lite
        )
