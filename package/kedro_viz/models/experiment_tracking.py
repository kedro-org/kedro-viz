"""kedro_viz.models.experiment_tracking` defines data models to represent run data and
tracking datasets."""
# pylint: disable=too-few-public-methods,protected-access,missing-class-docstring,missing-function-docstring
import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import TYPE_CHECKING, Any, Dict

from kedro.io import Version
from sqlalchemy import Column
from sqlalchemy.orm import declarative_base  # type: ignore
from sqlalchemy.sql.schema import ForeignKey
from sqlalchemy.types import JSON, Boolean, Integer, String

from .utils import get_dataset_type

if TYPE_CHECKING:
    try:
        # kedro 0.18.12 onwards
        from kedro.io import AbstractVersionedDataset
    except ImportError:
        # older versions
        from kedro.io import AbstractVersionedDataSet as AbstractVersionedDataset

logger = logging.getLogger(__name__)
Base = declarative_base()


class RunModel(Base):  # type: ignore
    """Data model to represent run data from a Kedro Session."""

    __tablename__ = "runs"

    id = Column(String, primary_key=True, index=True)
    blob = Column(JSON)

    class Config:
        orm_mode = True


class UserRunDetailsModel(Base):  # type: ignore
    """Data model to represent run details as defined by users through Kedro Viz."""

    __tablename__ = "user_run_details"

    id = Column(Integer, autoincrement=True, primary_key=True, index=True)
    run_id = Column(String, ForeignKey(RunModel.id), unique=True)
    bookmark = Column(Boolean, default=False)
    title = Column(String)
    notes = Column(String)

    class Config:
        orm_mode = True


class TrackingDatasetGroup(str, Enum):
    """Different groups to present together on the frontend."""

    PLOT = "plot"
    METRIC = "metric"
    JSON = "json"


# Map dataset types (as produced by get_dataset_type) to their group
TRACKING_DATASET_GROUPS = {
    "plotly.plotly_dataset.PlotlyDataSet": TrackingDatasetGroup.PLOT,
    "plotly.json_dataset.JSONDataSet": TrackingDatasetGroup.PLOT,
    "matplotlib.matplotlib_writer.MatplotlibWriter": TrackingDatasetGroup.PLOT,
    "tracking.metrics_dataset.MetricsDataSet": TrackingDatasetGroup.METRIC,
    "tracking.json_dataset.JSONDataSet": TrackingDatasetGroup.JSON,
}


@dataclass
class TrackingDatasetModel:
    """Data model to represent a tracked dataset."""

    dataset_name: str
    # dataset is the actual dataset instance, whereas dataset_type is a string.
    # e.g. "tracking.metrics_dataset.MetricsDataSet"
    dataset: "AbstractVersionedDataset"
    dataset_type: str = field(init=False)
    # runs is a mapping from run_id to loaded data.
    runs: Dict[str, Any] = field(init=False, default_factory=dict)

    def __post_init__(self):
        self.dataset_type = get_dataset_type(self.dataset)

    def load_tracking_data(self, run_id: str):
        # No need to reload data that has already been loaded.
        if run_id in self.runs:
            return  # pragma: no cover

        # Set the load version.
        self.dataset._version = Version(run_id, None)

        if not self.dataset.exists():
            logger.debug(
                "'%s' with version '%s' does not exist.", self.dataset_name, run_id
            )
            self.runs[run_id] = {}
            self.dataset._version = Version(None, None)
            return

        try:
            if TRACKING_DATASET_GROUPS[self.dataset_type] is TrackingDatasetGroup.PLOT:
                self.runs[run_id] = {self.dataset._filepath.name: self.dataset.load()}
            else:
                self.runs[run_id] = self.dataset.load()
        except Exception as exc:  # pylint: disable=broad-except # pragma: no cover
            logger.warning(
                "'%s' with version '%s' could not be loaded. Full exception: %s: %s",
                self.dataset_name,
                run_id,
                type(exc).__name__,
                exc,
            )
            self.runs[run_id] = {}
        self.dataset._version = Version(None, None)
