"""`kedro_viz.integrations.kedro.data_loader` provides interface to
load data from a Kedro project. It takes care of making sure viz can
load data from projects created in a range of Kedro versions.
"""

# pylint: disable=import-outside-toplevel, protected-access

import json
import logging
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from kedro import __version__
from kedro.framework.session import KedroSession
from kedro.framework.session.store import BaseSessionStore
from kedro.io import DataCatalog
from kedro.pipeline import Pipeline

logger = logging.getLogger(__name__)


class _VizNullPluginManager:
    """This class creates an empty ``hook_manager`` that will ignore all calls to hooks
    and registered plugins allowing the runner to function if no ``hook_manager``
    has been instantiated.

    NOTE: _VizNullPluginManager is a clone of _NullPluginManager class in Kedro.
    This was introduced to support the earliest version of Kedro which does not
    have _NullPluginManager defined
    """

    def __init__(self, *args, **kwargs):
        pass

    def __getattr__(self, name):
        return self

    def __call__(self, *args, **kwargs):
        pass


def _get_dataset_stats(project_path: Path) -> Dict:
    """Return the stats saved at stats.json as a dictionary if found.
    If not, return an empty dictionary

    Args:
        project_path: the path where the Kedro project is located.
    """
    try:
        stats_file_path = project_path / "stats.json"

        if not stats_file_path.exists():
            return {}

        with open(stats_file_path, encoding="utf8") as stats_file:
            stats = json.load(stats_file)
            return stats

    except Exception as exc:  # pylint: disable=broad-exception-caught
        logger.warning(
            "Unable to get dataset statistics from project path %s : %s",
            project_path,
            exc,
        )
        return {}


def load_data(
    project_path: Path,
    env: Optional[str] = None,
    ignore_plugins: bool = False,
    extra_params: Optional[Dict[str, Any]] = None,
) -> Tuple[DataCatalog, Dict[str, Pipeline], BaseSessionStore, Dict]:
    """Load data from a Kedro project.
    Args:
        project_path: the path whether the Kedro project is located.
        env: the Kedro environment to load the data. If not provided.
            it will use Kedro default, which is local.
        ignore_plugins: the flag to unregister all installed plugins in a kedro project.
        extra_params: Optional dictionary containing extra project parameters
            for underlying KedroContext. If specified, will update (and therefore
            take precedence over) the parameters retrieved from the project
            configuration.
    Returns:
        A tuple containing the data catalog and the pipeline dictionary
        and the session store.
    """
    from kedro.framework.project import pipelines
    from kedro.framework.startup import bootstrap_project

    bootstrap_project(project_path)

    with KedroSession.create(
        project_path=project_path,
        env=env,
        save_on_close=False,
        extra_params=extra_params,
    ) as session:
        # check for --ignore-plugins option
        if ignore_plugins:
            session._hook_manager = _VizNullPluginManager()  # type: ignore

        context = session.load_context()
        session_store = session._store
        catalog = context.catalog

        # Pipelines is a lazy dict-like object, so we force it to populate here
        # in case user doesn't have an active session down the line when it's first accessed.
        # Useful for users who have `get_current_session` in their `register_pipelines()`.
        pipelines_dict = dict(pipelines)
        stats_dict = _get_dataset_stats(project_path)

    return catalog, pipelines_dict, session_store, stats_dict
