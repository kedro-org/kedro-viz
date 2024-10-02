import pytest
from kedro.io import MemoryDataset

from kedro_viz.models.utils import get_dataset_type, serialize_dict


@pytest.mark.parametrize(
    "dataset,expected_type",
    [(None, ""), (MemoryDataset(), "io.memory_dataset.MemoryDataset")],
)
def test_get_dataset_type(dataset, expected_type):
    assert get_dataset_type(dataset) == expected_type


def test_serialize_dict_with_serializable_values():
    original_dict = {"key1": "value1", "key2": 123, "key3": 45.67, "key4": 0.1}
    expected_dict = {"key1": "value1", "key2": 123, "key3": 45.67, "key4": 0.1}
    assert serialize_dict(original_dict) == expected_dict


def test_serialize_dict_with_non_serializable_values():
    original_dict = {"key1": "value1", "key2": object()}
    expected_dict = {"key1": "value1", "key2": str(original_dict["key2"])}
    assert serialize_dict(original_dict) == expected_dict


def test_serialize_dict_with_nested_dict():
    original_dict = {
        "key1": "value1",
        "key2": {"nested_key1": "nested_value1", "nested_key2": [object(), "value2"]},
    }
    expected_dict = {
        "key1": "value1",
        "key2": {
            "nested_key1": "nested_value1",
            "nested_key2": str(original_dict["key2"]["nested_key2"]),
        },
    }
    assert serialize_dict(original_dict) == expected_dict


def test_serialize_dict_with_empty_dict():
    original_dict = {}
    expected_dict = {}
    assert serialize_dict(original_dict) == expected_dict


def test_serialize_dict_with_none_value():
    original_dict = {"key1": None}
    expected_dict = {"key1": None}
    assert serialize_dict(original_dict) == expected_dict
