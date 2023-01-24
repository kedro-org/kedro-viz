"""`kedro_viz.models.utils` contains utility functions used in the `kedro_viz.models` package"""

import logging

from kedro.io import AbstractDataSet

logger = logging.getLogger(__name__)


def get_dataset_type(dataset: AbstractDataSet) -> str:
    """Get the type of a dataset as a string-- the abbreviated name of the module to
    which ``dataset`` belongs, joined with the name of its class.

    Args:
        dataset: The dataset object to get the type of

    Returns:
        The abbreviated type of the dataset as a string.
    """
    if not dataset:
        return None
    abbreviated_module_name = ".".join(dataset.__class__.__module__.split(".")[-2:])
    class_name = f"{dataset.__class__.__qualname__}"
    return f"{abbreviated_module_name}.{class_name}"
