"""`kedro_viz.integrations.kedro.data_loader` provides interface to
load data from a Kedro project. It takes care of making sure viz can
load data from projects created in a range of Kedro versions.
"""
# pylint: disable=import-outside-toplevel
# pylint: disable=protected-access
from pathlib import Path
from typing import Dict, Optional, Tuple

from kedro import __version__
from kedro.io import DataCatalog
from kedro.pipeline import Pipeline
from semver import VersionInfo

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


def load_data(
    project_path: Path, env: str = None
) -> Tuple[DataCatalog, Dict[str, Pipeline], Optional[Path]]:
    """Load data from a Kedro project.
    Args:
        project_path: the path whether the Kedro project is located.
        env: the Kedro environment to load the data. If not provided.
            it will use Kedro default, which is local.
    Returns:
        A tuple containing the data catalog and the pipeline dictionary
        and the session store location path (this can be NONE if session_store
        is turned off or for Kedro 16 hence Optional)
    """
    _bootstrap(project_path)

    if KEDRO_VERSION.match(">=0.17.3"):
        from kedro.framework.project import pipelines
        from kedro.framework.session import KedroSession

        from kedro_viz.integrations.kedro.sqlite_store import SQLiteStore

        with KedroSession.create(
            project_path=project_path, env=env, save_on_close=False
        ) as session:

            context = session.load_context()
            session_store = session._store
            session_store_location = None
            if isinstance(session_store, SQLiteStore):
                session_store_location = session_store.location
            catalog = context.catalog

            # Pipelines is a lazy dict-like object, so we force it to populate here
            # in case user doesn't have an active session down the line when it's first accessed.
            # Useful for users who have `get_current_session` in their `register_pipelines()`.
            pipelines_dict = dict(pipelines)

        return catalog, pipelines_dict, session_store_location

    if KEDRO_VERSION.match(">=0.17.1"):
        from kedro.framework.session import KedroSession

        from kedro_viz.integrations.kedro.sqlite_store import SQLiteStore

        with KedroSession.create(
            project_path=project_path, env=env, save_on_close=False
        ) as session:

            context = session.load_context()
            session_store = session._store
            session_store_location = None
            if isinstance(session_store, SQLiteStore):
                session_store_location = session_store.location

        return context.catalog, context.pipelines, session_store_location

    if KEDRO_VERSION.match("==0.17.0"):
        from kedro.framework.session import KedroSession
        from kedro.framework.startup import _get_project_metadata

        from kedro_viz.integrations.kedro.sqlite_store import SQLiteStore

        metadata = _get_project_metadata(project_path)
        with KedroSession.create(
            package_name=metadata.package_name,
            project_path=project_path,
            env=env,
            save_on_close=False,
        ) as session:

            context = session.load_context()
            session_store = session._store
            session_store_location = None
            if isinstance(session_store, SQLiteStore):
                session_store_location = session_store.location

        return context.catalog, context.pipelines, session_store_location

    # pre-0.17 load_context version
    from kedro.framework.context import load_context

    context = load_context(project_path=project_path, env=env)
    return context.catalog, context.pipelines, None
