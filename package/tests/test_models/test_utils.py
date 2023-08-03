from kedro_viz.models.utils import get_dataset_type, get_file_size

try:
    # kedro 0.18.11 onwards
    from kedro.io import MemoryDataset
except ImportError:
    # older versions
    # older versions
    from kedro.io import MemoryDataSet as MemoryDataset


def test_get_dataset_type(dataset=None):
    assert get_dataset_type(dataset) == ""
    assert get_dataset_type(MemoryDataset()) == "io.memory_dataset.MemoryDataset"


def test_get_file_size(tmp_path):
    assert get_file_size(None) == 0

    # Create a mock file in the temporary directory
    mock_file = tmp_path / "mock_file.txt"
    mock_file.write_text("This is a mock file content.")

    assert get_file_size(mock_file) == 28

    mock_file = tmp_path / "mock_file.txt"
    mock_file.write_text("This is a mock file content.")
    assert get_file_size(tmp_path) == 0
