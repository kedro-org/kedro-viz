"""`kedro_viz.models.utils` contains utility functions used in the `kedro_viz.models` package"""
# pylint: disable=no-else-return,too-many-return-statements
import logging
from typing import TYPE_CHECKING, Any, Dict, Optional, Union

logger = logging.getLogger(__name__)


if TYPE_CHECKING:
    try:  # pragma: no cover
        # kedro 0.18.12 onwards
        from kedro.io.core import AbstractDataset
    except ImportError:  # pragma: no cover
        # older versions
        from kedro.io.core import AbstractDataSet as AbstractDataset


def get_dataset_type(dataset: "AbstractDataset") -> str:
    """Get the type of a dataset as a string: the abbreviated name of the module to
    which ``dataset`` belongs, joined with the name of its class.
    ::

        >>> get_dataset_type(kedro.extras.datasets.plotly.plotly_dataset.PlotlyDataSet())
        plotly.plotly_dataset.PlotlyDataSet

        >>> get_dataset_type(kedro_datasets.plotly.plotly_dataset.PlotlyDataSet())
        plotly.plotly_dataset.PlotlyDataSet

        >>> get_dataset_type(my.custom.path.to.plotly.plotly_dataset.PlotlyDataSet())
        plotly.plotly_dataset.PlotlyDataSet

        >>> get_dataset_type(package.PlotlyDataSet())
        package.PlotlyDataSet

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


def extract_data_source(
    node_type: Union[str, None], data_desc: Dict
) -> Union[Optional[str], Any]:
    """Get the relevant source logic used in generating this node's data, based
    on dataset type

    Args:
        node_type: Datatype for the dataset object as a string
        data_desc: Dict whose values store useful contextual information about the dataset

    Returns:
        String to display to user as the node source code
    """
    if node_type is None:
        return None

    format_type = node_type.split(".")[-1]

    if format_type in {"SQLQueryDataSet", "GBQQueryDataSet"}:
        return data_desc["sql"]

    return None
