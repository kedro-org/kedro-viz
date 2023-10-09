"""`kedro_viz.models.utils` contains utility functions used in the `kedro_viz.models` package"""
import logging
from typing import TYPE_CHECKING, Dict

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


def extract_data_source(node_type: str, data_desc: Dict) -> str:
    """Get the relevant source logic used in generating this node's data, based
    on dataset type

    Args:
        node_type: The dataset object to get the type of
        data_desc: Dict whose values store useful contextual information about the dataset

    Returns:
        String to display to user as the node source code
    """
    extracted_format_type = node_type.split(".")[-1]

    match extracted_format_type:
        case "SQLQueryDataSet" | "GBQQueryDataSet":
            return data_desc["sql"]
        case "APIDataSet":
            source = (
                f'Derived from {data_desc["url"]} using {data_desc["method"]} method.'
            )
            return source
        case "SparkHiveDataSet" | "SnowparkTableDataSet":
            extracted_table = (
                data_desc["table_name"]
                if extracted_format_type == "SnowparkTableDataSet"
                else data_desc["table"]
            )
            source = f'Derived from {extracted_table} table, in {data_desc["database"]} database.'
            return source
        case "SparkJDBCDataSet":
            source = (
                f'Derived from {data_desc["table"]} table, from {data_desc["url"]} url.'
            )
            return source
        case "PickleDataSet":
            source = f'Derived from {data_desc["url"]} url.'
            return source
        case "_":  # Default case
            return None
