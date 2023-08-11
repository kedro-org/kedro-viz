import pytest

from kedro_viz.models.utils import get_dataset_type

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
