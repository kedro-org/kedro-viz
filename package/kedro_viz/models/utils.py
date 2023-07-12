"""`kedro_viz.models.utils` contains utility functions used in the `kedro_viz.models` package"""
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    try:
        # kedro 0.18.12 onwards
        from kedro.io.core import AbstractDataset
    except ImportError:
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
