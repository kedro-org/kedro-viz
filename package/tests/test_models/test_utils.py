import pytest

from kedro_viz.models.utils import get_dataset_type, get_file_size

try:
    # kedro 0.18.11 onwards
    from kedro.io import MemoryDataset
except ImportError:
    # older versions
    from kedro.io import MemoryDataSet as MemoryDataset


@pytest.mark.parametrize(
    "dataset,expected_type",
    [(None, ""), (MemoryDataset(), "io.memory_dataset.MemoryDataset")],
)
def test_get_dataset_type(dataset, expected_type):
    assert get_dataset_type(dataset) == expected_type


@pytest.mark.parametrize("file_path", [None, "raw.txt"])
def test_get_file_size_invalid(file_path, example_text_file):
    # Test invalid paths to get file size
    assert get_file_size(file_path) is None
    # Test invalid directory to get file size
    assert get_file_size(example_text_file.parent) is None


def test_get_file_size_valid(example_text_file):
    # Test valid file path to get file size
    assert get_file_size(example_text_file) == 12
    # Test valid directory to get file size
    assert get_file_size(example_text_file.parent.parent) == 12
