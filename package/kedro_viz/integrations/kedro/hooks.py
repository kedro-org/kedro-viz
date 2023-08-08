# pylint: disable=broad-exception-caught
"""`kedro_viz.integrations.kedro.hooks` defines hooks to add additional
functionalities for a kedro run."""

import json
import logging
from collections import defaultdict
from typing import Any

import pandas as pd
from kedro.framework.hooks import hook_impl

from kedro_viz.integrations.kedro.utils import get_stats_dataset_name, stats_order

logger = logging.getLogger(__name__)


class DatasetStatsHook:
    """Class to collect dataset statistics during a kedro run
    and save it to a JSON file. The class currently supports
    (pd.DataFrame) dataset instances"""

    def __init__(self):
        self._stats = defaultdict(dict)

    @hook_impl
    def after_dataset_loaded(self, dataset_name: str, data: Any):
        """Hook to be invoked after a dataset is loaded from the catalog.
        Once the dataset is loaded, extract the required dataset statistics.
        The hook currently supports (pd.DataFrame) dataset instances

        Args:
            dataset_name: name of the dataset that was saved to the catalog.
            data: the actual data that was saved to the catalog.
        """
        try:
            stats_dataset_name = get_stats_dataset_name(dataset_name)
            if isinstance(data, pd.DataFrame):
                self._stats[stats_dataset_name]["rows"] = int(data.shape[0])
                self._stats[stats_dataset_name]["columns"] = int(data.shape[1])

        except Exception as exc:  # pragma: no cover
            logger.warning(
                "Unable to create statistics for the dataset %s : %s", dataset_name, exc
            )

    @hook_impl
    def after_pipeline_run(self):
        """Hook to be invoked after a pipeline runs.
        Once the pipeline run completes, write the dataset
        statistics to stats.json file

        """
        try:
            with open("stats.json", "w", encoding="utf8") as file:
                sorted_stats_data = {
                    dataset_name: stats_order(stats)
                    for dataset_name, stats in self._stats.items()
                }
                json.dump(sorted_stats_data, file)

        except Exception as exc:  # pragma: no cover
            logger.warning(
                "Unable to write dataset statistics for the pipeline: %s", exc
            )


dataset_stats_hook = DatasetStatsHook()
