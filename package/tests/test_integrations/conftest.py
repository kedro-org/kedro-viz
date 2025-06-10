"""Shared fixtures for integration tests."""

import pytest
from kedro.io import DataCatalog, MemoryDataset
from kedro.pipeline import Pipeline, node


@pytest.fixture
def sample_node():
    """Create a simple Kedro node for testing."""

    def dummy_func(x):
        return x

    return node(
        func=dummy_func, inputs="input_data", outputs="output_data", name="test_node"
    )


@pytest.fixture
def sample_pipeline(sample_node):
    """Create a simple pipeline for testing."""
    return Pipeline([sample_node])


@pytest.fixture
def sample_catalog():
    """Create a sample DataCatalog."""
    return DataCatalog({"test_dataset": MemoryDataset()})


@pytest.fixture
def mock_hash_node(mocker):
    """Mock hash_node function with consistent return value."""
    return mocker.patch(
        "kedro_viz.integrations.kedro.hooks_utils.hash_node",
        return_value="test_node_hash",
    )


@pytest.fixture
def mock_get_file_size(mocker):
    """Mock get_file_size function."""
    return mocker.patch(
        "kedro_viz.integrations.kedro.hooks_utils.get_file_size",
        return_value=1024,
    )
