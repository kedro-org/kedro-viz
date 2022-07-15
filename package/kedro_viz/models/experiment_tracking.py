"""kedro_viz.models.experiment_tracking` defines data models to represent run data
 from a Kedro Session."""
# pylint: disable=too-few-public-methods,missing-class-docstring
import logging
import types

from typing import Dict, Any

from dataclasses import field, dataclass

from enum import Enum

from sqlalchemy import Column
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql.schema import ForeignKey
from sqlalchemy.types import JSON, Boolean, Integer, String

from kedro.io import AbstractVersionedDataSet, Version

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
    """Represent all possible node types in the graph representation of a Kedro pipeline.
    The type needs to inherit from str as well so FastAPI can serialise it. See:
    https://fastapi.tiangolo.com/tutorial/path-params/#working-with-python-enumerations
    """

    # PLOT = "plot"
    METRIC = "metric"
    JSON = "json"


@dataclass
class TrackingDatasetModel:
    dataset_name: str
    dataset: AbstractVersionedDataSet
    dataset_type: str = field(init=False)
    runs: Dict[str, Any] = field(
        init=False, default_factory=dict
    )  # map from run_id to data

    def __post_init__(self):
        self.dataset_type = get_dataset_type(self.dataset)

    def load_tracking_data(self, run_id: str):
        if run_id in self.runs:
            return

        self.dataset._version = Version(run_id, None)  # set load version

        try:
            from kedro.extras.datasets import tracking, json

            tracking.JSONDataSet._load = json.JSONDataSet._load
            tracking.MetricsDataSet._load = json.JSONDataSet._load
            self.runs[run_id] = self.dataset.load()
        except Exception as exc:
            logger.warning(
                "'%s' with version '%s' could not be loaded. Full exception: %s",
                self.dataset_name,
                run_id,
                exc,
            )
            self.runs[run_id] = {}

        self.dataset._version = None


# TODO: where does this belong?
def get_dataset_type(dataset: AbstractVersionedDataSet) -> str:
    return f"{dataset.__class__.__module__}.{dataset.__class__.__qualname__}"
