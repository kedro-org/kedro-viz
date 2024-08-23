"""Module to load data from Kedro project and populate Kedro Viz Repositories"""

from pathlib import Path
from typing import Any, Dict, Optional

from kedro.framework.session.store import BaseSessionStore
from kedro.io import DataCatalog
from kedro.pipeline import Pipeline

from kedro_viz.data_access import DataAccessManager, data_access_manager
from kedro_viz.database import make_db_session_factory
from kedro_viz.integrations.kedro import data_loader as kedro_data_loader
from kedro_viz.integrations.kedro.sqlite_store import SQLiteStore


def populate_data(
    data_access_manager: DataAccessManager,
    catalog: DataCatalog,
    pipelines: Dict[str, Pipeline],
    session_store: BaseSessionStore,
    stats_dict: Dict,
):  # pylint: disable=redefined-outer-name
    """Populate data repositories. Should be called once on application start
    if creating an api app from project.
    """

    if isinstance(session_store, SQLiteStore):
        session_store.sync()
        session_class = make_db_session_factory(session_store.location)
        data_access_manager.set_db_session(session_class)

    data_access_manager.add_catalog(catalog, pipelines)

    # add dataset stats before adding pipelines as the data nodes
    # need stats information and they are created during add_pipelines
    data_access_manager.add_dataset_stats(stats_dict)

    data_access_manager.add_pipelines(pipelines)


def load_and_populate_data(
    path: Path,
    env: Optional[str] = None,
    include_hooks: bool = False,
    package_name: Optional[str] = None,
    pipeline_name: Optional[str] = None,
    extra_params: Optional[Dict[str, Any]] = None,
):
    """Loads underlying Kedro project data and populates Kedro Viz Repositories"""

    # Loads data from underlying Kedro Project
    catalog, pipelines, session_store, stats_dict = kedro_data_loader.load_data(
        path,
        env,
        include_hooks,
        package_name,
        extra_params,
    )

    pipelines = (
        pipelines
        if pipeline_name is None
        else {pipeline_name: pipelines[pipeline_name]}
    )

    # Creates data repositories which are used by Kedro Viz Backend APIs
    populate_data(data_access_manager, catalog, pipelines, session_store, stats_dict)
