"""`kedro_viz.models.utils` contains utility functions used in the `kedro_viz.models` package"""

import json
import logging
from typing import TYPE_CHECKING

logger = logging.getLogger(__name__)


if TYPE_CHECKING:
    try:  # pragma: no cover
        # kedro 0.18.12 onwards
        from kedro.io.core import AbstractDataset
    except ImportError:  # pragma: no cover
        # older versions
        from kedro.io.core import AbstractDataSet as AbstractDataset  # type: ignore


def get_dataset_type(dataset: "AbstractDataset") -> str:
    """Get the type of a dataset as a string: the abbreviated name of the module to
    which ``dataset`` belongs, joined with the name of its class.
    ::

        >>> get_dataset_type(kedro.extras.datasets.plotly.plotly_dataset.PlotlyDataset())
        plotly.plotly_dataset.PlotlyDataset

        >>> get_dataset_type(kedro_datasets.plotly.plotly_dataset.PlotlyDataset())
        plotly.plotly_dataset.PlotlyDataset

        >>> get_dataset_type(my.custom.path.to.plotly.plotly_dataset.PlotlyDataset())
        plotly.plotly_dataset.PlotlyDataset

        >>> get_dataset_type(package.PlotlyDataset())
        package.PlotlyDataset

    Args:
        dataset: The dataset object to get the type of

    Returns:
        The abbreviated type of the dataset as a string.
    """
    if dataset is None:
        # return an empty string to avoid breaking the interface
        return ""
    abbreviated_module_name = ".".join(dataset.__class__.__module__.split(".")[-2:])
    class_name = f"{dataset.__class__.__qualname__}"
    return f"{abbreviated_module_name}.{class_name}"


def serialize_dict(original_dict: dict) -> dict:
    """Serialize a dictionary by converting its values to strings
    if the value is non serializable."""
    serialized_dict = {}

    for key, value in original_dict.items():
        if isinstance(value, dict):
            # Recursively process the nested dictionary
            serialized_dict[key] = serialize_dict(value)
        else:
            try:
                # Check if the value is serializable
                json.dumps(value)
                serialized_dict[key] = value
            except (TypeError, ValueError):
                # Convert to string if serialization fails
                serialized_dict[key] = str(value)  # type: ignore
    return serialized_dict
