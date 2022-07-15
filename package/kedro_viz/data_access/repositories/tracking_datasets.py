from collections import defaultdict

from typing import List, Dict, Set, Any

from kedro.io import AbstractVersionedDataSet
from kedro_viz.models.experiment_tracking import (
    TrackingDatasetGroup,
    TrackingDatasetModel,
    get_dataset_type,
)


# TODO: make note that it's populated using populate_data, not when graphql point hit
# TODO: reuse DataNode/DataNoteMetadata models, or update those models to this
# TODO: should registered pipeline drop down apply to experiment tracking?


class TrackingDatasetsRepository:
    def __init__(self):
        self.tracking_datasets_by_group: Dict[
            TrackingDatasetGroup, List[TrackingDatasetModel]
        ] = defaultdict(list)

    def get_tracking_datasets_by_group_by_run_ids(
        self, run_ids: List[str], group: TrackingDatasetGroup = None
    ) -> List[TrackingDatasetModel]:
        tracking_datasets = (
            self.tracking_datasets_by_group.get(group, [])
            if group is not None
            else sum(self.tracking_datasets_by_group.values(), [])
            # NOTE this will be tidied with only groups
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

    def is_tracking_dataset(self, dataset) -> bool:
        # TODO: make sure check for versioned works correctly
        # TODO: do as isinstance instead?
        return (
            get_dataset_type(dataset) in TRACKING_DATASET_GROUPS
            and dataset._version is not None
        )


# TODO: tidy into enum somehow? Where to put this?
TRACKING_DATASET_GROUPS = {
    # "kedro.extras.datasets.plotly.plotly_dataset.PlotlyDataSet": TrackingDatasetGroup.PLOT,
    # "kedro.extras.datasets.plotly.json_dataset.JSONDataSet": TrackingDatasetGroup.PLOT,
    "kedro.extras.datasets.tracking.metrics_dataset.MetricsDataSet": TrackingDatasetGroup.METRIC,
    "kedro.extras.datasets.tracking.json_dataset.JSONDataSet": TrackingDatasetGroup.JSON,
}
