"""`kedro_viz.data_access.repositories.tracking_datasets` defines an interface to
centralise access to datasets used in experiment tracking."""
# pylint: disable=missing-class-docstring,missing-function-docstring,protected-access
from collections import defaultdict
from typing import Dict, List, Optional

from kedro.io import AbstractVersionedDataSet

from kedro_viz.models.experiment_tracking import (
    TrackingDatasetGroup,
    TrackingDatasetModel,
    get_dataset_type,
)

TRACKING_DATASET_GROUPS = {
    # TODO: add these.
    # "kedro.extras.datasets.plotly.plotly_dataset.PlotlyDataSet": TrackingDatasetGroup.PLOT,
    # "kedro.extras.datasets.plotly.json_dataset.JSONDataSet": TrackingDatasetGroup.PLOT,
    "kedro.extras.datasets.tracking.metrics_dataset.MetricsDataSet": TrackingDatasetGroup.METRIC,
    "kedro.extras.datasets.tracking.json_dataset.JSONDataSet": TrackingDatasetGroup.JSON,
}


class TrackingDatasetsRepository:
    def __init__(self):
        self.tracking_datasets_by_group: Dict[
            TrackingDatasetGroup, List[TrackingDatasetModel]
        ] = defaultdict(list)

    def get_tracking_datasets_by_group_by_run_ids(
        self, run_ids: List[str], group: Optional[TrackingDatasetGroup]
    ) -> List[TrackingDatasetModel]:
        # TODO: group should become required argument when we query by
        # metric and json.
        tracking_datasets = (
            self.tracking_datasets_by_group.get(group, [])
            if group is not None
            else sum(self.tracking_datasets_by_group.values(), [])
        )

        for dataset in tracking_datasets:
            for run_id in run_ids:
                dataset.load_tracking_data(run_id)
        return tracking_datasets

    def add_tracking_dataset(
        self, dataset_name: str, dataset: AbstractVersionedDataSet
    ) -> None:
        tracking_dataset = TrackingDatasetModel(dataset_name, dataset)
        tracking_dataset_group = TRACKING_DATASET_GROUPS[tracking_dataset.dataset_type]
        self.tracking_datasets_by_group[tracking_dataset_group].append(tracking_dataset)

    @staticmethod
    def is_tracking_dataset(dataset) -> bool:
        return (
            get_dataset_type(dataset) in TRACKING_DATASET_GROUPS
            and dataset._version is not None
        )
