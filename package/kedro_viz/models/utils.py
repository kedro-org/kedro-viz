"""`kedro_viz.models.utils` contains utility functions used in the `kedro_viz.models` package"""
from typing import TYPE_CHECKING
import logging
import fsspec

logger = logging.getLogger(__name__)

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


def get_file_size(file_path: str) -> int:
    """Get the dataset file size using fsspec. If the file_path is a directory, get the latest file created (this corresponds to the latest run)

    Args:
        file_path: The file path for the dataset
    """
    try:
        if not file_path:
            return 0

        resolved_file_path = file_path
        fs, _, paths = fsspec.get_fs_token_paths(file_path)

        # Get information about the file
        file_info = fs.info(paths[0])

        if file_info["type"] == "directory":
            files = fs.ls(paths[0])
            # Filter only directories from the list
            directories = [f for f in files if fs.isdir(f)]
            resolved_file_path = fs.ls(
                max(directories, key=lambda f: fs.info(f)["created"])
            )[0]

        with fs.open(resolved_file_path) as file:
            file_size_in_bytes = file.size
            return file_size_in_bytes

    except Exception as e:
        logger.error(f"Error getting file size for {file_path} : {e}")
        return 0
