"""`kedro_viz.integrations.kedro.data_loader` provides interface to
load data from a Kedro project. It takes care of making sure viz can
load data from projects created in a range of Kedro versions.
"""
# pylint: disable=import-outside-toplevel, protected-access
# pylint: disable=missing-function-docstring, no-else-return

import base64
import json
import logging
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from kedro import __version__
from kedro.framework.session.store import BaseSessionStore

try:
    from kedro_datasets import (  # isort:skip
        json as json_dataset,
        matplotlib,
        plotly,
        tracking,
    )
except ImportError:
    from kedro.extras.datasets import (  # Safe since ImportErrors are suppressed within kedro.
        json as json_dataset,
        matplotlib,
        plotly,
        tracking,
    )

from kedro.io import DataCatalog
from kedro.io.core import get_filepath_str
from kedro.pipeline import Pipeline
from semver import VersionInfo

logger = logging.getLogger(__name__)
KEDRO_VERSION = VersionInfo.parse(__version__)


def _bootstrap(project_path: Path):
    """Bootstrap the integration by running various Kedro bootstrapping methods
    depending on the version
    """
    if KEDRO_VERSION.match(">=0.17.3"):
        from kedro.framework.startup import bootstrap_project

        bootstrap_project(project_path)
        return

    if KEDRO_VERSION.match(">=0.17.1"):
        from kedro.framework.project import configure_project
        from kedro.framework.startup import _get_project_metadata

        package_name = _get_project_metadata(project_path).package_name

        configure_project(package_name)
        return


def get_dataset_stats(project_path: Path) -> Dict:
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
    extra_params: Optional[Dict[str, Any]] = None,
) -> Tuple[DataCatalog, Dict[str, Pipeline], BaseSessionStore, Dict]:
    """Load data from a Kedro project.
    Args:
        project_path: the path whether the Kedro project is located.
        env: the Kedro environment to load the data. If not provided.
            it will use Kedro default, which is local.
        extra_params: Optional dictionary containing extra project parameters
            for underlying KedroContext. If specified, will update (and therefore
            take precedence over) the parameters retrieved from the project
            configuration.
    Returns:
        A tuple containing the data catalog and the pipeline dictionary
        and the session store.
    """
    _bootstrap(project_path)

    if KEDRO_VERSION.match(">=0.17.3"):
        from kedro.framework.project import pipelines
        from kedro.framework.session import KedroSession

        with KedroSession.create(
            project_path=project_path,
            env=env,  # type: ignore
            save_on_close=False,
            extra_params=extra_params,  # type: ignore
        ) as session:
            context = session.load_context()
            session_store = session._store
            catalog = context.catalog
            # Pipelines is a lazy dict-like object, so we force it to populate here
            # in case user doesn't have an active session down the line when it's first accessed.
            # Useful for users who have `get_current_session` in their `register_pipelines()`.
            pipelines_dict = dict(pipelines)
            stats_dict = get_dataset_stats(project_path)

        return catalog, pipelines_dict, session_store, stats_dict
    elif KEDRO_VERSION.match(">=0.17.1"):
        from kedro.framework.session import KedroSession

        with KedroSession.create(
            project_path=project_path,
            env=env,  # type: ignore
            save_on_close=False,
            extra_params=extra_params,  # type: ignore
        ) as session:
            context = session.load_context()
            session_store = session._store
            stats_dict = get_dataset_stats(project_path)

        return context.catalog, context.pipelines, session_store, stats_dict
    else:
        # Since Viz is only compatible with kedro>=0.17.0, this just matches 0.17.0
        from kedro.framework.session import KedroSession
        from kedro.framework.startup import _get_project_metadata

        metadata = _get_project_metadata(project_path)
        with KedroSession.create(
            package_name=metadata.package_name,
            project_path=project_path,
            env=env,  # type: ignore
            save_on_close=False,
            extra_params=extra_params,  # type: ignore
        ) as session:
            context = session.load_context()
            session_store = session._store
            stats_dict = get_dataset_stats(project_path)

        return context.catalog, context.pipelines, session_store, stats_dict


# The dataset type is available as an attribute if and only if the import from kedro
# did not suppress an ImportError. i.e. hasattr(matplotlib, "MatplotlibWriter") is True
# when matplotlib dependencies are installed.
# These datasets do not have _load methods defined (tracking and matplotlib) or do not
# load to json (plotly), hence the need to define _load here.
if hasattr(matplotlib, "MatplotlibWriter"):

    def matplotlib_writer_load(dataset: matplotlib.MatplotlibWriter) -> str:
        load_path = get_filepath_str(dataset._get_load_path(), dataset._protocol)
        with dataset._fs.open(load_path, mode="rb") as img_file:
            base64_bytes = base64.b64encode(img_file.read())
        return base64_bytes.decode("utf-8")

    matplotlib.MatplotlibWriter._load = matplotlib_writer_load

if hasattr(plotly, "JSONDataSet"):
    plotly.JSONDataSet._load = json_dataset.JSONDataSet._load

if hasattr(plotly, "PlotlyDataSet"):
    plotly.PlotlyDataSet._load = json_dataset.JSONDataSet._load

if hasattr(tracking, "JSONDataSet"):
    tracking.JSONDataSet._load = json_dataset.JSONDataSet._load

if hasattr(tracking, "MetricsDataSet"):
    tracking.MetricsDataSet._load = json_dataset.JSONDataSet._load
