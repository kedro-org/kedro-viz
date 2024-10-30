import operator
from typing import Any, Dict, Iterable, List


def _is_dict_list(collection: Any) -> bool:
    if isinstance(collection, list):
        return isinstance(collection[0], dict) if len(collection) > 0 else True
    return False


def assert_modular_pipelines_tree_equal(response: Dict, expected: Dict):
    """Assert if modular pipelines tree are equal."""
    # first assert that they have the same set of keys
    assert sorted(response.keys()) == sorted(expected.keys())

    # then compare the dictionary at each key recursively
    for key in response:
        if isinstance(response[key], dict):
            assert_modular_pipelines_tree_equal(response[key], expected[key])
        elif _is_dict_list(response[key]):
            assert_dict_list_equal(response[key], expected[key], sort_keys=("id",))
        elif isinstance(response[key], list):
            assert sorted(response[key]) == sorted(expected[key])
        else:
            assert response[key] == expected[key]


def assert_nodes_equal(response_nodes, expected_nodes):
    node_sort_keys = operator.itemgetter("id")
    for response_node, expected_node in zip(
        sorted(response_nodes, key=node_sort_keys),
        sorted(expected_nodes, key=node_sort_keys),
    ):
        # since tags and pipelines are Sets, which are unordered,
        # to assert them, we have to sort first
        response_node_tags = response_node.pop("tags")
        expected_node_tags = expected_node.pop("tags")
        assert sorted(response_node_tags) == sorted(expected_node_tags)

        response_node_pipelines = response_node.pop("pipelines")
        expected_node_pipelines = expected_node.pop("pipelines")

        assert sorted(response_node_pipelines) == sorted(expected_node_pipelines)

        # sort modular pipelines
        if response_node["modular_pipelines"]:
            response_node["modular_pipelines"].sort()
        if expected_node["modular_pipelines"]:
            expected_node["modular_pipelines"].sort()

        assert response_node == expected_node


def assert_dict_list_equal(
    response: List[Dict], expected: List[Dict], sort_keys: Iterable[str]
):
    """Assert two list of dictionaries with undeterministic order
    to be equal by sorting them first based on a sort key.
    """
    if len(response) == 0:
        assert len(expected) == 0
        return

    assert sorted(response, key=operator.itemgetter(*sort_keys)) == sorted(
        expected, key=operator.itemgetter(*sort_keys)
    )


def assert_example_data(response_data):
    """Assert graph response for the `example_pipelines` and `example_catalog` fixtures."""
    expected_edges = [
        {"source": "f2b25286", "target": "d5a8b994"},
        {"source": "782e4a43", "target": "0ecea0de"},
        {"source": "13399a82", "target": "782e4a43"},
        {"source": "f1f1425b", "target": "f2b25286"},
        {"source": "0ecea0de", "target": "f2b25286"},
        {"source": "f0ebef01", "target": "782e4a43"},
        {"source": "13399a82", "target": "uk.data_processing"},
        {"source": "uk.data_processing", "target": "0ecea0de"},
        {"source": "f0ebef01", "target": "uk.data_processing"},
        {"source": "f1f1425b", "target": "uk"},
        {"source": "13399a82", "target": "uk"},
        {"source": "f1f1425b", "target": "uk.data_science"},
        {"source": "f0ebef01", "target": "uk"},
        {"source": "uk.data_science", "target": "d5a8b994"},
        {"source": "0ecea0de", "target": "uk.data_science"},
        {"source": "uk", "target": "d5a8b994"},
    ]
    assert_dict_list_equal(
        response_data.pop("edges"), expected_edges, sort_keys=("source", "target")
    )
    # compare nodes
    expected_nodes = [
        {
            "id": "782e4a43",
            "name": "process_data",
            "tags": ["split"],
            "pipelines": ["__default__", "data_processing"],
            "modular_pipelines": ["uk.data_processing"],
            "type": "task",
            "parameters": {"uk.data_processing.train_test_split": 0.1},
        },
        {
            "id": "13399a82",
            "name": "uk.data_processing.raw_data",
            "tags": ["split"],
            "pipelines": ["__default__", "data_processing"],
            "modular_pipelines": ["uk", "uk.data_processing"],
            "type": "data",
            "layer": "raw",
            "dataset_type": "pandas.csv_dataset.CSVDataset",
            "stats": None,
        },
        {
            "id": "f0ebef01",
            "name": "params:uk.data_processing.train_test_split",
            "tags": ["split"],
            "pipelines": ["__default__", "data_processing"],
            "modular_pipelines": None,
            "type": "parameters",
            "layer": None,
            "dataset_type": None,
            "stats": None,
        },
        {
            "id": "0ecea0de",
            "name": "model_inputs",
            "tags": ["train", "split"],
            "pipelines": ["__default__", "data_science", "data_processing"],
            "modular_pipelines": ["uk.data_science", "uk.data_processing"],
            "type": "data",
            "layer": "model_inputs",
            "dataset_type": "pandas.csv_dataset.CSVDataset",
            "stats": {"columns": 12, "rows": 29768},
        },
        {
            "id": "f2b25286",
            "name": "train_model",
            "tags": ["train"],
            "pipelines": ["__default__", "data_science"],
            "modular_pipelines": ["uk.data_science"],
            "type": "task",
            "parameters": {
                "train_test_split": 0.1,
                "num_epochs": 1000,
            },
        },
        {
            "id": "f1f1425b",
            "name": "parameters",
            "tags": ["train"],
            "pipelines": ["__default__", "data_science"],
            "modular_pipelines": None,
            "type": "parameters",
            "layer": None,
            "dataset_type": None,
            "stats": None,
        },
        {
            "id": "d5a8b994",
            "name": "uk.data_science.model",
            "tags": ["train"],
            "pipelines": ["__default__", "data_science"],
            "modular_pipelines": ["uk", "uk.data_science"],
            "type": "data",
            "layer": None,
            "dataset_type": "io.memory_dataset.MemoryDataset",
            "stats": None,
        },
        {
            "id": "uk.data_processing",
            "name": "uk.data_processing",
            "tags": ["split"],
            "pipelines": ["__default__"],
            "type": "modularPipeline",
            "modular_pipelines": None,
            "layer": None,
            "dataset_type": None,
            "stats": None,
        },
        {
            "id": "uk.data_science",
            "name": "uk.data_science",
            "tags": ["train"],
            "pipelines": ["__default__"],
            "type": "modularPipeline",
            "modular_pipelines": None,
            "layer": None,
            "dataset_type": None,
            "stats": None,
        },
        {
            "id": "uk",
            "name": "uk",
            "tags": ["split", "train"],
            "pipelines": ["__default__"],
            "type": "modularPipeline",
            "modular_pipelines": None,
            "layer": None,
            "dataset_type": None,
            "stats": None,
        },
    ]
    assert_nodes_equal(response_data.pop("nodes"), expected_nodes)

    # compare modular pipelines
    expected_modular_pipelines = {
        "__root__": {
            "id": "__root__",
            "name": "__root__",
            "inputs": [],
            "outputs": [],
            "children": [
                {"id": "d5a8b994", "type": "data"},
                {"id": "13399a82", "type": "data"},
                {"id": "f1f1425b", "type": "parameters"},
                {"id": "f0ebef01", "type": "parameters"},
                {"id": "uk", "type": "modularPipeline"},
            ],
        },
        "uk": {
            "id": "uk",
            "name": "uk",
            "inputs": ["f1f1425b", "f0ebef01", "13399a82"],
            "outputs": ["d5a8b994"],
            "children": [
                {"id": "uk.data_processing", "type": "modularPipeline"},
                {"id": "uk.data_science", "type": "modularPipeline"},
                {"id": "0ecea0de", "type": "data"},
            ],
        },
        "uk.data_processing": {
            "id": "uk.data_processing",
            "name": "uk.data_processing",
            "inputs": ["f0ebef01", "13399a82"],
            "outputs": ["0ecea0de"],
            "children": [{"id": "782e4a43", "type": "task"}],
        },
        "uk.data_science": {
            "id": "uk.data_science",
            "name": "uk.data_science",
            "inputs": ["0ecea0de", "f1f1425b"],
            "outputs": ["d5a8b994"],
            "children": [{"id": "f2b25286", "type": "task"}],
        },
    }
    assert_modular_pipelines_tree_equal(
        response_data.pop("modular_pipelines"), expected_modular_pipelines
    )

    # compare the rest
    assert response_data == {
        "tags": [{"id": "split", "name": "split"}, {"id": "train", "name": "train"}],
        "layers": ["raw", "model_inputs"],
        "pipelines": [
            {"id": "__default__", "name": "__default__"},
            {"id": "data_science", "name": "data_science"},
            {"id": "data_processing", "name": "data_processing"},
        ],
        "selected_pipeline": "__default__",
    }


def assert_example_data_from_file(response_data):
    """Assert graph response for the `example_pipelines` and `example_catalog` fixtures."""
    expected_edges = [
        {"source": "f2b25286", "target": "d5a8b994"},
        {"source": "782e4a43", "target": "0ecea0de"},
        {"source": "13399a82", "target": "782e4a43"},
        {"source": "f1f1425b", "target": "f2b25286"},
        {"source": "0ecea0de", "target": "f2b25286"},
        {"source": "f0ebef01", "target": "782e4a43"},
        {"source": "13399a82", "target": "uk.data_processing"},
        {"source": "uk.data_processing", "target": "0ecea0de"},
        {"source": "f0ebef01", "target": "uk.data_processing"},
        {"source": "f1f1425b", "target": "uk"},
        {"source": "13399a82", "target": "uk"},
        {"source": "f1f1425b", "target": "uk.data_science"},
        {"source": "f0ebef01", "target": "uk"},
        {"source": "uk.data_science", "target": "d5a8b994"},
        {"source": "0ecea0de", "target": "uk.data_science"},
        {"source": "uk", "target": "d5a8b994"},
    ]
    assert_dict_list_equal(
        response_data.pop("edges"), expected_edges, sort_keys=("source", "target")
    )
    # compare nodes
    expected_nodes = [
        {
            "id": "782e4a43",
            "name": "process_data",
            "tags": ["split"],
            "pipelines": ["__default__", "data_processing"],
            "modular_pipelines": ["uk.data_processing"],
            "type": "task",
            "parameters": {"uk.data_processing.train_test_split": 0.1},
        },
        {
            "id": "13399a82",
            "name": "uk.data_processing.raw_data",
            "tags": ["split"],
            "pipelines": ["__default__", "data_processing"],
            "modular_pipelines": ["uk", "uk.data_processing"],
            "type": "data",
            "layer": "raw",
            "dataset_type": "pandas.csv_dataset.CSVDataset",
        },
        {
            "id": "f0ebef01",
            "name": "params:uk.data_processing.train_test_split",
            "tags": ["split"],
            "pipelines": ["__default__", "data_processing"],
            "modular_pipelines": None,
            "type": "parameters",
            "layer": None,
            "dataset_type": None,
        },
        {
            "id": "0ecea0de",
            "name": "model_inputs",
            "tags": ["train", "split"],
            "pipelines": ["__default__", "data_science", "data_processing"],
            "modular_pipelines": None,
            "type": "data",
            "layer": "model_inputs",
            "dataset_type": "pandas.csv_dataset.CSVDataset",
        },
        {
            "id": "f2b25286",
            "name": "train_model",
            "tags": ["train"],
            "pipelines": ["__default__", "data_science"],
            "modular_pipelines": ["uk.data_science"],
            "type": "task",
            "parameters": {
                "train_test_split": 0.1,
                "num_epochs": 1000,
            },
        },
        {
            "id": "f1f1425b",
            "name": "parameters",
            "tags": ["train"],
            "pipelines": ["__default__", "data_science"],
            "modular_pipelines": None,
            "type": "parameters",
            "layer": None,
            "dataset_type": None,
        },
        {
            "id": "d5a8b994",
            "name": "uk.data_science.model",
            "tags": ["train"],
            "pipelines": ["__default__", "data_science"],
            "modular_pipelines": ["uk", "uk.data_science"],
            "type": "data",
            "layer": None,
            "dataset_type": "io.memory_dataset.MemoryDataset",
        },
        {
            "id": "uk.data_processing",
            "name": "uk.data_processing",
            "tags": [],
            "pipelines": ["__default__"],
            "type": "modularPipeline",
            "modular_pipelines": None,
            "layer": None,
            "dataset_type": None,
        },
        {
            "id": "uk.data_science",
            "name": "uk.data_science",
            "tags": [],
            "pipelines": ["__default__"],
            "type": "modularPipeline",
            "modular_pipelines": None,
            "layer": None,
            "dataset_type": None,
        },
        {
            "id": "uk",
            "name": "uk",
            "tags": [],
            "pipelines": ["__default__"],
            "type": "modularPipeline",
            "modular_pipelines": None,
            "layer": None,
            "dataset_type": None,
        },
    ]
    assert_nodes_equal(response_data.pop("nodes"), expected_nodes)

    # compare modular pipelines
    expected_modular_pipelines = {
        "__root__": {
            "children": [
                {"id": "f1f1425b", "type": "parameters"},
                {"id": "uk", "type": "modularPipeline"},
            ],
            "id": "__root__",
            "inputs": [],
            "name": "__root__",
            "outputs": [],
        },
        "uk": {
            "children": [
                {"id": "uk.data_science", "type": "modularPipeline"},
                {"id": "uk.data_processing", "type": "modularPipeline"},
            ],
            "id": "uk",
            "inputs": ["f0ebef01", "13399a82", "f1f1425b"],
            "name": "uk",
            "outputs": ["d5a8b994"],
        },
        "uk.data_processing": {
            "children": [
                {"id": "13399a82", "type": "data"},
                {"id": "782e4a43", "type": "task"},
            ],
            "id": "uk.data_processing",
            "inputs": ["f0ebef01", "13399a82"],
            "name": "uk.data_processing",
            "outputs": ["0ecea0de"],
        },
        "uk.data_science": {
            "children": [
                {"id": "f2b25286", "type": "task"},
                {"id": "d5a8b994", "type": "data"},
            ],
            "id": "uk.data_science",
            "inputs": ["0ecea0de", "f1f1425b"],
            "name": "uk.data_science",
            "outputs": ["d5a8b994"],
        },
    }
    assert_modular_pipelines_tree_equal(
        response_data.pop("modular_pipelines"), expected_modular_pipelines
    )

    # compare the rest
    assert response_data == {
        "tags": [{"id": "split", "name": "split"}, {"id": "train", "name": "train"}],
        "layers": ["raw", "model_inputs"],
        "pipelines": [
            {"id": "__default__", "name": "__default__"},
            {"id": "data_science", "name": "data_science"},
            {"id": "data_processing", "name": "data_processing"},
        ],
        "selected_pipeline": "__default__",
    }


def assert_example_transcoded_data(response_data):
    """Assert graph response for the `example_transcoded_pipelines`
    and `example_transcoded_catalog` fixtures."""
    expected_edges = [
        {"source": "f1f1425b", "target": "7e29e365"},
        {"source": "f0ebef01", "target": "58a383dd"},
        {"source": "7c58d8e6", "target": "58a383dd"},
        {"source": "58a383dd", "target": "0ecea0de"},
        {"source": "7e29e365", "target": "1d06a0d7"},
        {"source": "0ecea0de", "target": "7e29e365"},
    ]
    assert_dict_list_equal(
        response_data.pop("edges"), expected_edges, sort_keys=("source", "target")
    )
    # compare nodes
    expected_nodes = [
        {
            "id": "58a383dd",
            "name": "process_data",
            "tags": ["split"],
            "pipelines": ["data_processing", "__default__"],
            "type": "task",
            "modular_pipelines": None,
            "parameters": {"uk.data_processing.train_test_split": 0.1},
        },
        {
            "id": "7c58d8e6",
            "name": "raw_data",
            "tags": ["split"],
            "pipelines": ["data_processing", "__default__"],
            "type": "data",
            "modular_pipelines": None,
            "layer": None,
            "dataset_type": "io.memory_dataset.MemoryDataset",
            "stats": None,
        },
        {
            "id": "f0ebef01",
            "name": "params:uk.data_processing.train_test_split",
            "tags": ["split"],
            "pipelines": ["data_processing", "__default__"],
            "type": "parameters",
            "modular_pipelines": None,
            "layer": None,
            "dataset_type": None,
            "stats": None,
        },
        {
            "id": "0ecea0de",
            "name": "model_inputs",
            "tags": ["train", "split"],
            "pipelines": ["data_processing", "__default__"],
            "type": "data",
            "modular_pipelines": None,
            "layer": None,
            "dataset_type": None,
            "stats": None,
        },
        {
            "id": "7e29e365",
            "name": "train_model",
            "tags": ["train"],
            "pipelines": ["data_processing", "__default__"],
            "type": "task",
            "modular_pipelines": None,
            "parameters": {"train_test_split": 0.1, "num_epochs": 1000},
        },
        {
            "id": "f1f1425b",
            "name": "parameters",
            "tags": ["train"],
            "pipelines": ["data_processing", "__default__"],
            "type": "parameters",
            "modular_pipelines": None,
            "layer": None,
            "dataset_type": None,
            "stats": None,
        },
        {
            "id": "1d06a0d7",
            "name": "model",
            "tags": ["train"],
            "pipelines": ["data_processing", "__default__"],
            "type": "data",
            "modular_pipelines": None,
            "layer": None,
            "dataset_type": "io.memory_dataset.MemoryDataset",
            "stats": None,
        },
    ]

    assert_nodes_equal(response_data.pop("nodes"), expected_nodes)
