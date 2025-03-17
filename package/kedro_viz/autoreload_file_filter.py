"""
This module provides a custom file filter for autoreloading that filters out files based on allowed
file extensions and patterns specified in a .gitignore file.
"""

import logging
from pathlib import Path
from typing import Optional, Set

from pathspec import GitIgnoreSpec
from watchfiles import Change, DefaultFilter

from kedro_viz.utils import load_gitignore_patterns

logger = logging.getLogger(__name__)


class AutoreloadFileFilter(DefaultFilter):
    """
    Custom file filter for autoreloading that extends DefaultFilter.
    Filters out files based on allowed file extensions and patterns specified in a .gitignore file.
    """

    allowed_extensions: Set[str] = {".py", ".yml", ".yaml", ".json"}

    def __init__(self, base_path: Optional[Path] = None):
        """
        Initialize the AutoreloadFileFilter.

        Args:
            base_path (Optional[Path]): The base path to set as the current working directory
                for the filter.
        """
        self.cwd = base_path or Path.cwd()

        # Call the superclass constructor
        super().__init__()

        # Load .gitignore patterns
        self.gitignore_spec = load_gitignore_patterns(self.cwd)

    def __call__(self, change: Change, path: str) -> bool:
        """
        Determine whether a file change should be processed.

        Args:
            change (Change): The type of change detected.
            path (str): The path to the file that changed.

        Returns:
            bool: True if the file should be processed, False otherwise.
        """
        if not super().__call__(change, path):
            logger.debug("Filtered out by DefaultFilter: %s", path)
            return False

        path_obj = Path(path)

        # Exclude files matching .gitignore patterns
        try:
            relative_path = path_obj.resolve().relative_to(self.cwd.resolve())
        except ValueError:
            logger.debug("Path not relative to CWD: %s", path)
            return False

        try:
            if self.gitignore_spec and self.gitignore_spec.match_file(
                str(relative_path)
            ):
                logger.debug("Filtered out by .gitignore: %s", relative_path)
                return False
        # ruff: noqa: BLE001
        except Exception as exc:
            logger.debug("Exception during .gitignore matching: %s", exc)
            return True  # Pass the file if .gitignore matching fails

        # Include only files with allowed extensions
        if path_obj.suffix in self.allowed_extensions:
            logger.debug("Allowed file: %s", path)
            return True
        logger.debug("Filtered out by allowed_extensions: %s", path_obj.suffix)
        return False
