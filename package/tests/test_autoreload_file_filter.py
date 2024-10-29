import logging
import shutil
import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest
from watchfiles import Change, DefaultFilter

from kedro_viz.autoreload_file_filter import AutoreloadFileFilter

logger = logging.getLogger(__name__)


@pytest.fixture
def file_filter(tmp_path):
    # Create a .gitignore file
    gitignore_path = tmp_path / ".gitignore"
    gitignore_path.write_text("ignored.py\n")

    # Initialize the filter with the test directory as base_path
    return AutoreloadFileFilter(base_path=tmp_path)


def test_no_gitignore(tmp_path):
    gitignored_file = tmp_path / "ignored.py"
    gitignored_file.touch()

    # Initialize the filter without a .gitignore file
    gitignore_path = tmp_path / ".gitignore"
    if gitignore_path.exists():
        gitignore_path.unlink()
    file_filter = AutoreloadFileFilter(base_path=tmp_path)

    result = file_filter(Change.modified, str(gitignored_file))
    assert result, "File should pass the filter when .gitignore is missing"


def test_gitignore_exception(file_filter, tmp_path):
    allowed_file = tmp_path / "test.py"
    allowed_file.touch()

    with patch(
        "pathspec.PathSpec.match_file", side_effect=Exception("Mocked exception")
    ):
        result = file_filter(Change.modified, str(allowed_file))
        assert result, "Filter should pass the file if .gitignore matching fails"


def test_allowed_file(file_filter, tmp_path):
    allowed_file = tmp_path / "test.py"
    allowed_file.touch()

    result = file_filter(Change.modified, str(allowed_file))
    assert result, "Allowed file should pass the filter"


def test_disallowed_file(file_filter, tmp_path):
    disallowed_file = tmp_path / "test.txt"
    disallowed_file.touch()

    result = file_filter(Change.modified, str(disallowed_file))
    assert not result, "Disallowed file should not pass the filter"


def test_gitignored_file(file_filter, tmp_path):
    gitignored_file = tmp_path / "ignored.py"
    gitignored_file.touch()

    result = file_filter(Change.modified, str(gitignored_file))
    assert not result, "Gitignored file should not pass the filter"


def test_non_relative_path(file_filter):
    original_cwd = Path.cwd().parent  # Go up one directory
    outside_file = original_cwd / "outside.py"
    outside_file.touch()

    result = file_filter(Change.modified, str(outside_file))
    assert not result, "File outside the CWD should not pass the filter"

    # Cleanup
    outside_file.unlink()


def test_no_allowed_extension(file_filter, tmp_path):
    no_extension_file = tmp_path / "no_extension"
    no_extension_file.touch()

    result = file_filter(Change.modified, str(no_extension_file))
    assert not result, "File without allowed extension should not pass the filter"


def test_directory_path(file_filter, tmp_path):
    directory_path = tmp_path / "some_directory"
    directory_path.mkdir()

    result = file_filter(Change.modified, str(directory_path))
    assert not result, "Directories should not pass the filter"


def test_filtered_out_by_default_filter(file_filter, tmp_path, mocker):
    filtered_file = tmp_path / "filtered.py"
    filtered_file.touch()

    # Mock the super().__call__ method to return False
    mocker.patch.object(DefaultFilter, "__call__", return_value=False)

    result = file_filter(Change.modified, str(filtered_file))
    assert not result, "File should be filtered out by DefaultFilter"
