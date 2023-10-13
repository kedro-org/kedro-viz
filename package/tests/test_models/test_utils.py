import pytest

from kedro_viz.models.utils import extract_data_source, get_dataset_type

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


data_node_inputs = [
    (
        "pandas.sql_dataset.SQLQueryDataSet",
        {"sql": "SELECT * FROM test_data_node_metadata_with_sql_source"},
        "SELECT * FROM test_data_node_metadata_with_sql_source",
    ),
    ("unrecognised_dataset_type", {}, None),
    (None, {}, None),
]


@pytest.mark.parametrize("node_type,data_desc,expected_source", data_node_inputs)
def test_source_data_extraction(node_type, data_desc, expected_source):
    extractedSource = extract_data_source(node_type, data_desc)
    assert extractedSource == expected_source
