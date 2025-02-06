"""Transcoding related utility functions."""

import hashlib
from typing import Any, Dict, Tuple, Union

from kedro.io.data_catalog import DataCatalog
from kedro.pipeline import Pipeline

TRANSCODING_SEPARATOR = "@"

DEFAULT_VIZ_OPTIONS = {
    "display": {
        "expandPipelinesBtn": False,
        "exportBtn": False,
        "globalNavigation": False,
        "labelBtn": False,
        "layerBtn": False,
        "metadataPanel": False,
        "miniMap": False,
        "sidebar": False,
        "zoomToolbar": False,
    },
    "expandAllPipelines": False,
    "behaviour": {
        "reFocus": False,
    },
    "theme": "dark",
}


def _hash(value: str):
    return hashlib.sha1(value.encode("UTF-8")).hexdigest()[:8]


def _hash_input_output(item: str) -> str:
    """Hash the input/output dataset."""
    return (
        _hash(_strip_transcoding(item))
        if TRANSCODING_SEPARATOR in item
        else _hash(item)
    )


def _transcode_split(element: str) -> Tuple[str, str]:
    """Split the name by the transcoding separator.
    If the transcoding part is missing, empty string will be put in.

    Returns:
        Node input/output name before the transcoding separator, if present.
    Raises:
        ValueError: Raised if more than one transcoding separator
        is present in the name.
    """
    split_name = element.split(TRANSCODING_SEPARATOR)

    if len(split_name) > 2:  # noqa: PLR2004
        raise ValueError(  # pragma: no cover
            f"Expected maximum 1 transcoding separator, found {len(split_name) - 1} "
            f"instead: '{element}'."
        )
    if len(split_name) == 1:
        split_name.append("")

    return tuple(split_name)  # type: ignore


def _strip_transcoding(element: str) -> str:
    """Strip out the transcoding separator and anything that follows.

    Returns:
        Node input/output name before the transcoding separator, if present.
    Raises:
        ValueError: Raised if more than one transcoding separator
        is present in the name.
    """
    return _transcode_split(element)[0]


def is_dataset_param(dataset_name: str) -> bool:
    """Return whether a dataset is a parameter"""
    return dataset_name.lower().startswith("params:") or dataset_name == "parameters"


def merge_dicts(dict_one: Dict[str, Any], dict_two: Dict[str, Any]) -> Dict[str, Any]:
    """Utility to merge two dictionaries"""
    import copy

    merged = copy.deepcopy(dict_one)

    for key, value in dict_two.items():
        if isinstance(value, dict) and key in merged:
            merged[key] = merge_dicts(merged[key], value)
        else:
            merged[key] = value
    return merged


class NotebookUser:
    """Represent a notebook user exploring Kedro Pipeline
    Args:
        pipeline (Union[Pipeline, Dict[str, Pipeline]]): Kedro Pipeline to visualize
        catalog (DataCatalog): Data Catalog for the pipeline
        options (Dict[str, Any]): Kedro-Viz visualization options available at
        https://github.com/kedro-org/kedro-viz/blob/main/README.npm.md#configure-kedro-viz-with-options
    """

    def __init__(
        self,
        pipeline: Union[Pipeline, Dict[str, Pipeline]] = None,
        catalog: DataCatalog = None,
        options: Union[Dict[str, Any], None] = None,
    ):
        self.pipeline = pipeline
        self.catalog = catalog
        self.options = (
            DEFAULT_VIZ_OPTIONS
            if options is None
            else merge_dicts(DEFAULT_VIZ_OPTIONS, options)
        )
