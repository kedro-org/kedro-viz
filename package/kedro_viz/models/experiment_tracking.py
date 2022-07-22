"""kedro_viz.models.experiment_tracking` defines data models to represent run data and
tracking datasets."""
# pylint: disable=too-few-public-methods,protected-access,missing-class-docstring,missing-function-docstring
import base64
import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import TYPE_CHECKING, Any, Dict

from kedro.io import AbstractVersionedDataSet, Version
from kedro.io.core import get_filepath_str
from sqlalchemy import Column
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql.schema import ForeignKey
from sqlalchemy.types import JSON, Boolean, Integer, String

logger = logging.getLogger(__name__)
Base = declarative_base()


class RunModel(Base):
    """Data model to represent run data from a Kedro Session."""

    __tablename__ = "runs"

    id = Column(String, primary_key=True, index=True)
    blob = Column(JSON)

    class Config:
        orm_mode = True


class UserRunDetailsModel(Base):
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


TRACKING_DATASET_GROUPS = {
    "kedro.extras.datasets.plotly.plotly_dataset.PlotlyDataSet": TrackingDatasetGroup.PLOT,
    "kedro.extras.datasets.plotly.json_dataset.JSONDataSet": TrackingDatasetGroup.PLOT,
    "kedro.extras.datasets.matplotlib.matplotlib_writer.MatplotlibWriter": TrackingDatasetGroup.PLOT,  # pylint: disable=line-too-long
    "kedro.extras.datasets.tracking.metrics_dataset.MetricsDataSet": TrackingDatasetGroup.METRIC,
    "kedro.extras.datasets.tracking.json_dataset.JSONDataSet": TrackingDatasetGroup.JSON,
}


@dataclass
class TrackingDatasetModel:
    """Data model to represent a tracked dataset."""

    dataset_name: str
    # dataset is the actual dataset instance, whereas dataset_type is a string.
    # e.g. "kedro.extras.datasets.tracking.metrics_dataset.MetricsDataSet"
    dataset: AbstractVersionedDataSet
    dataset_type: str = field(init=False)
    # runs is a mapping from run_id to loaded data.
    runs: Dict[str, Any] = field(init=False, default_factory=dict)

    def is_plot_node(self):
        return (
            self.dataset_type
            == "kedro.extras.datasets.plotly.plotly_dataset.PlotlyDataSet"
            or self.dataset_type
            == "kedro.extras.datasets.plotly.json_dataset.JSONDataSet"
        )

    def is_image_node(self):
        return (
            self.dataset_type
            == "kedro.extras.datasets.matplotlib.matplotlib_writer.MatplotlibWriter"
        )

    def __post_init__(self):
        self.dataset_type = get_dataset_type(self.dataset)

    def load_tracking_data(self, run_id: str):
        # No need to reload data that has already been loaded.
        if run_id in self.runs:
            return  # pragma: no cover

        # Set the load version.
        self.dataset._version = Version(run_id, None)

        try:
            # tracking datasets do not have load methods defined yet but would be the
            # same as json loader.
            # pylint: disable=import-outside-toplevel
            from kedro.extras.datasets import json, matplotlib, plotly, tracking

            tracking.JSONDataSet._load = json.JSONDataSet._load  # type: ignore
            tracking.MetricsDataSet._load = json.JSONDataSet._load  # type: ignore

            if TRACKING_DATASET_GROUPS[self.dataset_type] is TrackingDatasetGroup.PLOT:

                if self.is_plot_node():
                    plotly.JSONDataSet._load = json.JSONDataSet._load  # type: ignore
                    plotly.PlotlyDataSet._load = json.JSONDataSet._load  # type: ignore

                if self.is_image_node():
                    matplotlib.MatplotlibWriter._load = matplotlib_writer_load  # type: ignore

                self.runs[run_id] = {self.dataset._filepath.name: self.dataset.load()}
            else:
                self.runs[run_id] = self.dataset.load()
        except Exception as exc:  # pylint: disable=broad-except
            logger.warning(
                "'%s' with version '%s' could not be loaded. Full exception: %s",
                self.dataset_name,
                run_id,
                exc,
            )
            self.runs[run_id] = {}

        self.dataset._version = None


def get_dataset_type(dataset: AbstractVersionedDataSet) -> str:
    return f"{dataset.__class__.__module__}.{dataset.__class__.__qualname__}"


# "MatplotlibWriter" is in quotes to avoid importing it.
# also so it doesn't blow up if user doesn't have the dataset dependencies installed.
if TYPE_CHECKING:  # pragma: no cover
    from kedro.extras.datasets.matplotlib.matplotlib_writer import MatplotlibWriter


def matplotlib_writer_load(dataset: "MatplotlibWriter") -> str:
    load_path = get_filepath_str(dataset._get_load_path(), dataset._protocol)
    with open(load_path, "rb") as img_file:
        base64_bytes = base64.b64encode(img_file.read())
    return base64_bytes.decode("utf-8")
