import logging
from pathlib import Path
from typing import Optional, Set

import pathspec
from watchfiles import Change, DefaultFilter

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
            base_path (Optional[Path]): The base path to set as the current working directory for the filter.
        """
        self.cwd = base_path or Path.cwd()

        # Call the superclass constructor
        super().__init__()

        # Load .gitignore patterns
        gitignore_path = self.cwd / ".gitignore"
        try:
            with open(gitignore_path, "r") as gitignore_file:
                ignore_patterns = gitignore_file.read().splitlines()
            self.gitignore_spec = pathspec.PathSpec.from_lines(
                "gitwildmatch", ignore_patterns
            )
        except FileNotFoundError:
            self.gitignore_spec = None

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
            logger.debug(f"Filtered out by DefaultFilter: {path}")
            return False

        path_obj = Path(path)

        # Exclude files matching .gitignore patterns
        try:
            relative_path = path_obj.resolve().relative_to(self.cwd.resolve())
        except ValueError:
            logger.debug(f"Path not relative to CWD: {path}")
            return False

        try:
            if self.gitignore_spec and self.gitignore_spec.match_file(
                str(relative_path)
            ):
                logger.debug(f"Filtered out by .gitignore: {relative_path}")
                return False
        except Exception as e:
            logger.debug(f"Exception during .gitignore matching: {e}")
            return True  # Pass the file if .gitignore matching fails

        # Include only files with allowed extensions
        if path_obj.suffix in self.allowed_extensions:
            logger.debug(f"Allowed file: {path}")
            return True
        else:
            logger.debug(f"Filtered out by allowed_extensions: {path_obj.suffix}")
            return False
