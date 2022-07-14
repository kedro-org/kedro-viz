from typing import List, Dict, Set, Any

from kedro.io import AbstractVersionedDataSet
from kedro_viz.models.experiment_tracking import (
    TrackingDatasetGroup,
    TrackingDatasetModel,
    TRACKING_DATASET_GROUPS,
    get_dataset_type,
)


# TODO: make note that it's populated using populate_data, not when graphql point hit
# TODO: reuse DataNode/DataNoteMetadata models, or update those models to this
# TODO: should registered pipeline drop down apply to experiment tracking?


class TrackingDatasetsRepository:
    def __init__(self):
        self.tracking_datasets: Set[TrackingDatasetModel] = set()

    def get_tracking_datasets_by_group_by_run_ids(
        self, run_ids: List[str], group: TrackingDatasetGroup = None
    ) -> Set[TrackingDatasetModel]:
        if group is None:
            datasets = self.tracking_datasets
        else:
            datasets = {
                dataset
                for dataset in self.tracking_datasets
                if dataset.dataset_group == group
            }
        for dataset in datasets:
            for run_id in run_ids:
                dataset.load_tracking_data(run_id)
        return datasets

    def add_tracking_dataset(
        self, dataset_name: str, dataset: AbstractVersionedDataSet
    ) -> None:
        self.tracking_datasets.add(TrackingDatasetModel(dataset_name, dataset))

    def is_tracking_dataset(self, dataset) -> bool:
        # TODO: make sure check for versioned works correctly
        # TODO: do as isinstance instead?
        return (
            get_dataset_type(dataset) in TRACKING_DATASET_GROUPS
            and dataset._version is not None
        )
