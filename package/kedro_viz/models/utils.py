"""`kedro_viz.models.utils` contains utility functions used in the `kedro_viz.models` package"""
import logging
from typing import TYPE_CHECKING, Union

import fsspec

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


def get_file_size(file_path: Union[str, None]) -> int:
    """Get the dataset file size using fsspec. If the file_path is a directory,
    get the latest file created (this corresponds to the latest run)

    Args:
        file_path: The file path for the dataset
    """
    try:
        if not file_path:
            return 0

        resolved_file_path = file_path
        file_system, _, paths = fsspec.get_fs_token_paths(file_path)

        # Get information about the file
        file_info = file_system.info(paths[0])

        if file_info["type"] == "directory":
            files = file_system.ls(paths[0])
            # Filter only directories from the list
            directories = [
                file
                for file in files
                if file_system.isdir(file) and len(file_system.ls(file)) > 0
            ]
            resolved_file_path = file_system.ls(
                max(directories, key=lambda f: file_system.info(f)["created"])
            )[0]

        with file_system.open(resolved_file_path) as file:
            file_size_in_bytes = file.size
            return file_size_in_bytes

    except Exception as exc:  # pylint: disable=broad-exception-caught
        logger.error("Error getting file size for %s : %s", file_path, exc)
        return 0
