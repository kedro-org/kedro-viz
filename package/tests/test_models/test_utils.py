import pytest
from kedro.io import MemoryDataset

from kedro_viz.models.utils import get_dataset_type


@pytest.mark.parametrize(
    "dataset,expected_type",
    [(None, ""), (MemoryDataset(), "io.memory_dataset.MemoryDataset")],
)
def test_get_dataset_type(dataset, expected_type):
    assert get_dataset_type(dataset) == expected_type
