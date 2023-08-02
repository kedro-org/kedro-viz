"""`kedro_viz.integrations.kedro.hooks` defines hooks to add additional
functionalities for a kedro run."""

import logging
from collections import defaultdict
from typing import Any

from kedro.framework.hooks import hook_impl

logger = logging.getLogger(__name__)


class DatasetStatsHook:
    """Hook to collect dataset statistics during a kedro run
    and save it to a JSON file"""

    def __init__(self):
        self._stats = defaultdict(dict)

    @hook_impl
    def after_dataset_loaded(self, dataset_name: str, data: Any):
        """Hook to be invoked after a dataset is loaded from the catalog.
        Once the dataset is loaded, extract the required dataset statistics

        Args:
            dataset_name: name of the dataset that was saved to the catalog.
            data: the actual data that was saved to the catalog.
        """
        try:
            import pandas as pd  # pylint: disable=import-outside-toplevel

            if isinstance(data, pd.DataFrame):
                self._stats[dataset_name] = {}
                self._stats[dataset_name]["rows"] = int(data.shape[0])
                self._stats[dataset_name]["columns"] = int(data.shape[1])

        except ImportError as exc:  # pragma: no cover
            logger.warning("%s : %s", exc.__class__.__name__, exc.msg)

        except Exception as exc:  # pylint: disable=broad-exception-caught
            logger.error(
                "Error creating the stats for the dataset %s : %s", dataset_name, exc
            )

    @hook_impl
    def after_pipeline_run(self):
        """Hook to be invoked after a pipeline runs.
        Once the pipeline run completes, write the dataset
        statistics to stats.json file

        """
        try:
            import json as json_lib  # pylint: disable=import-outside-toplevel

            with open("stats.json", "w", encoding="utf8") as file:
                json_lib.dump(self._stats, file)

        except ImportError as exc:  # pragma: no cover
            logger.warning("%s : %s", exc.__class__.__name__, exc.msg)

        except Exception as exc:  # pylint: disable=broad-exception-caught
            logger.error("Error writing the stats for the pipeline: %s", exc)


dataset_stats_hook = DatasetStatsHook()
