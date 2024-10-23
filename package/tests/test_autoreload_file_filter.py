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
def test_environment():
    # Create a temporary directory
    test_dir = tempfile.mkdtemp()
    yield test_dir
    # Remove temp directory
    shutil.rmtree(test_dir)


@pytest.fixture
def file_filter(test_environment):
    test_dir = Path(test_environment)
    # Create a .gitignore file
    gitignore_path = test_dir / ".gitignore"
    gitignore_path.write_text("ignored.py\n")

    # Initialize the filter with the test directory as base_path
    return AutoreloadFileFilter(base_path=test_dir)


def test_no_gitignore(test_environment):
    test_dir = Path(test_environment)
    gitignored_file = test_dir / "ignored.py"
    gitignored_file.touch()

    # Initialize the filter without a .gitignore file
    gitignore_path = test_dir / ".gitignore"
    if gitignore_path.exists():
        gitignore_path.unlink()
    file_filter = AutoreloadFileFilter(base_path=test_dir)

    result = file_filter(Change.modified, str(gitignored_file))
    assert result, "File should pass the filter when .gitignore is missing"


def test_gitignore_exception(file_filter, test_environment):
    test_dir = Path(test_environment)
    allowed_file = test_dir / "test.py"
    allowed_file.touch()

    with patch(
        "pathspec.PathSpec.match_file", side_effect=Exception("Mocked exception")
    ):
        result = file_filter(Change.modified, str(allowed_file))
        assert result, "Filter should pass the file if .gitignore matching fails"


def test_allowed_file(file_filter, test_environment):
    test_dir = Path(test_environment)
    allowed_file = test_dir / "test.py"
    allowed_file.touch()

    result = file_filter(Change.modified, str(allowed_file))
    assert result, "Allowed file should pass the filter"


def test_disallowed_file(file_filter, test_environment):
    test_dir = Path(test_environment)
    disallowed_file = test_dir / "test.txt"
    disallowed_file.touch()

    result = file_filter(Change.modified, str(disallowed_file))
    assert not result, "Disallowed file should not pass the filter"


def test_gitignored_file(file_filter, test_environment):
    test_dir = Path(test_environment)
    gitignored_file = test_dir / "ignored.py"
    gitignored_file.touch()

    result = file_filter(Change.modified, str(gitignored_file))
    assert not result, "Gitignored file should not pass the filter"


def test_non_relative_path(file_filter, test_environment):
    original_cwd = Path.cwd().parent  # Go up one directory
    outside_file = original_cwd / "outside.py"
    outside_file.touch()

    result = file_filter(Change.modified, str(outside_file))
    assert not result, "File outside the CWD should not pass the filter"

    # Cleanup
    outside_file.unlink()


def test_no_allowed_extension(file_filter, test_environment):
    test_dir = Path(test_environment)
    no_extension_file = test_dir / "no_extension"
    no_extension_file.touch()

    result = file_filter(Change.modified, str(no_extension_file))
    assert not result, "File without allowed extension should not pass the filter"


def test_directory_path(file_filter, test_environment):
    test_dir = Path(test_environment)
    directory_path = test_dir / "some_directory"
    directory_path.mkdir()

    result = file_filter(Change.modified, str(directory_path))
    assert not result, "Directories should not pass the filter"

def test_filtered_out_by_default_filter(file_filter, test_environment, mocker):
    test_dir = Path(test_environment)
    filtered_file = test_dir / "filtered.py"
    filtered_file.touch()

    # Mock the super().__call__ method to return False
    mocker.patch.object(DefaultFilter, '__call__', return_value=False)

    result = file_filter(Change.modified, str(filtered_file))
    assert not result, "File should be filtered out by DefaultFilter"  
