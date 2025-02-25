"""`kedro_viz.integrations.notebook.data_loader` provides interface to
load data from a notebook. It takes care of making sure viz can
load data from pipelines created in a range of Kedro versions.
"""

from typing import Dict, Optional, Tuple, Union, cast

from kedro.io import DataCatalog
from kedro.pipeline import Pipeline

from kedro_viz.data_access import data_access_manager
from kedro_viz.server import populate_data


def load_data_for_notebook_users(
    notebook_pipeline: Union[Pipeline, Dict[str, Pipeline]],
    notebook_catalog: Optional[DataCatalog],
) -> Tuple[DataCatalog, Dict[str, Pipeline], Dict]:
    """Load data from a notebook user's pipeline"""
    # Create a dummy data catalog with all datasets as memory datasets
    catalog = DataCatalog() if notebook_catalog is None else notebook_catalog
    stats_dict: Dict = {}

    notebook_user_pipeline = notebook_pipeline

    # create a default pipeline if a dictionary of pipelines are sent
    if isinstance(notebook_user_pipeline, dict):
        notebook_user_pipeline = {
            "__default__": notebook_user_pipeline["__default__"]
            if "__default__" in notebook_user_pipeline
            else cast(Pipeline, sum(notebook_user_pipeline.values()))
        }
    else:
        notebook_user_pipeline = {"__default__": notebook_user_pipeline}

    return catalog, notebook_user_pipeline, stats_dict


def load_and_populate_data_for_notebook_users(
    notebook_pipeline: Union[Pipeline, Dict[str, Pipeline]],
    notebook_catalog: Optional[DataCatalog],
):
    """Loads pipeline data and populates Kedro Viz Repositories for a notebook user"""
    catalog, pipelines, stats_dict = load_data_for_notebook_users(
        notebook_pipeline, notebook_catalog
    )

    # make each cell independent
    data_access_manager.reset_fields()

    # Creates data repositories which are used by Kedro Viz Backend APIs
    populate_data(data_access_manager, catalog, pipelines, stats_dict)
