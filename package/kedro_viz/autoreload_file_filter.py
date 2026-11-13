"""
This module provides a custom file filter for autoreloading that filters out files based on allowed
file extensions, patterns specified in a .gitignore file, and changes under the notebooks folder.
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
    Filters out files based on allowed file extensions, patterns specified in a .gitignore file,
    and changes under the notebooks folder.
    """

    allowed_extensions: Set[str] = {".py", ".yml", ".yaml", ".json"}
    ignore_patterns: tuple[str, ...] = ("notebooks/**",)

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
        self.ignore_spec = GitIgnoreSpec.from_lines(
            "gitwildmatch", list(self.ignore_patterns)
        )

    def _matches_ignore_patterns(self, relative_path: Path) -> Optional[bool]:
        """Return True if ignored, False if not, None if matching failed."""
        try:
            if self.gitignore_spec and self.gitignore_spec.match_file(
                str(relative_path)
            ):
                logger.debug("Filtered out by .gitignore: %s", relative_path)
                return True

            if self.ignore_spec.match_file(str(relative_path)):
                logger.debug("Filtered out by ignore_patterns: %s", relative_path)
                return True
        # ruff: noqa: BLE001
        except Exception as exc:
            logger.debug("Exception during ignore pattern matching: %s", exc)
            return None

        return False

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

        try:
            relative_path = path_obj.resolve().relative_to(self.cwd.resolve())
        except ValueError:
            logger.debug("Path not relative to CWD: %s", path)
            return False

        ignore_result = self._matches_ignore_patterns(relative_path)
        if ignore_result is True:
            return False

        allowed = path_obj.suffix in self.allowed_extensions
        if allowed:
            logger.debug("Allowed file: %s", path)
        else:
            logger.debug("Filtered out by allowed_extensions: %s", path_obj.suffix)
        return allowed
