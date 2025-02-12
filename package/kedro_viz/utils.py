"""Transcoding related utility functions."""

import hashlib
from pathlib import Path
from typing import Optional, Tuple

from pathspec import GitIgnoreSpec

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

def load_gitignore_patterns(project_path: Path) -> Optional[GitIgnoreSpec]:
    gitignore_path = project_path / ".gitignore"

    if not gitignore_path.exists():
        return
    
    with open(gitignore_path, "r", encoding="utf-8") as gitignore_file:
        ignore_patterns = gitignore_file.read().splitlines()
        gitignore_spec = GitIgnoreSpec.from_lines(
            "gitwildmatch", ignore_patterns
        )
        return gitignore_spec

def is_file_ignored(file_path: Path, project_path: Optional[Path], gitignore_spec: Optional[GitIgnoreSpec]) -> bool:
    """Returns True if the file should be ignored."""
    if file_path.name.startswith("."):  # Ignore hidden files/folders
        return True
    if gitignore_spec and project_path and gitignore_spec.match_file(str(file_path.relative_to(project_path))):
        return True
    return False
