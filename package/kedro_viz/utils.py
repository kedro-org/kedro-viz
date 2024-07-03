"""Transcoding related utility functions."""

import ast
import hashlib
from pathlib import Path
from typing import Tuple

from kedro_viz.launchers.utils import _find_kedro_project

TRANSCODING_SEPARATOR = "@"


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


# Helper to get the source code of a function
def get_function_source_code(func_name: str):
    project_dir = _find_kedro_project(Path.cwd())
    if project_dir:
        for filepath in project_dir.rglob("*.py"):
            with open(filepath, "r") as file:
                file_content = file.read()
            parsed_content = ast.parse(file_content)
            for node in ast.walk(parsed_content):
                if isinstance(node, ast.FunctionDef) and node.name == func_name:
                    return ast.unparse(node)
    return None
