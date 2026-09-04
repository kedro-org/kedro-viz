"""`kedro_viz.integrations.kedro.data_loader` provides interface to
load data from a Kedro project. It takes care of making sure viz can
load data from projects created in a range of Kedro versions.
"""

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

from kedro_viz.integrations.kedro.abstract_dataset_lite import AbstractDatasetLite
from kedro_viz.integrations.kedro.inspection import node_extras as node_extras_loader
from kedro_viz.integrations.kedro.lite_parser import LiteParser
from kedro_viz.integrations.utils import _VizNullPluginManager
from kedro_viz.models.metadata import Metadata, NodeExtras

logger = logging.getLogger(__name__)


def _create_node_extras_mapping(project_path: Path) -> Dict[str, NodeExtras]:
    """Create a mapping from node names to NodeExtras objects.

    Args:
        project_path: the path where the Kedro project is located.

    Returns:
        Dictionary mapping node names to NodeExtras objects
    """

    return node_extras_loader.load_node_extras(project_path)


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

    with kedro_session:
        # check for --include-hooks option
        if not include_hooks:
            kedro_session._hook_manager = _VizNullPluginManager()  # type: ignore

        context = kedro_session.load_context()

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
