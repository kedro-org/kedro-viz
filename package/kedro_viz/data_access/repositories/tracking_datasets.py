"""`kedro_viz.data_access.repositories.tracking_datasets` defines an interface to
centralise access to datasets used in experiment tracking."""
# pylint: disable=missing-class-docstring,missing-function-docstring,protected-access
from collections import defaultdict
from typing import TYPE_CHECKING, Dict, List

from kedro_viz.models.experiment_tracking import (
    TRACKING_DATASET_GROUPS,
    TrackingDatasetGroup,
    TrackingDatasetModel,
)
from kedro_viz.models.utils import get_dataset_type

if TYPE_CHECKING:
    try:
        # kedro 0.18.12 onwards
        from kedro.io import AbstractVersionedDataset
    except ImportError:
        # older versions
        from kedro.io import (  # type: ignore # isort:skip
            AbstractVersionedDataSet as AbstractVersionedDataset,
        )


class TrackingDatasetsRepository:
    def __init__(self):
        self.tracking_datasets_by_group: Dict[
            TrackingDatasetGroup, List[TrackingDatasetModel]
        ] = defaultdict(list)

    def get_tracking_datasets_by_group_by_run_ids(
        self, run_ids: List[str], group: TrackingDatasetGroup
    ) -> List[TrackingDatasetModel]:
        tracking_datasets = self.tracking_datasets_by_group[group]

        for dataset in tracking_datasets:
            for run_id in run_ids:
                dataset.load_tracking_data(run_id)
        return tracking_datasets

    def add_tracking_dataset(
        self, dataset_name: str, dataset: "AbstractVersionedDataset"
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
