import json
from collections import defaultdict

import fsspec
import pytest
from kedro.io import MemoryDataset
from kedro.io.core import get_filepath_str


def test_dataset_stats_hook_create(example_dataset_stats_hook_obj):
    # Assert for an instance of defaultdict
    assert hasattr(example_dataset_stats_hook_obj, "_stats")
    assert isinstance(example_dataset_stats_hook_obj._stats, defaultdict)


def test_after_catalog_created(example_dataset_stats_hook_obj, example_catalog):
    example_dataset_stats_hook_obj.after_catalog_created(example_catalog)

    # Assert for catalog creation
    assert hasattr(example_dataset_stats_hook_obj, "datasets")
    assert example_dataset_stats_hook_obj.datasets == example_catalog


@pytest.mark.parametrize(
    "dataset_name", ["companies", "companies@pandas1", "model_inputs"]
)
def test_after_dataset_loaded(
    dataset_name, example_dataset_stats_hook_obj, example_catalog, example_data_frame
):
    example_dataset_stats_hook_obj.after_catalog_created(example_catalog)
    example_dataset_stats_hook_obj.after_dataset_loaded(
        dataset_name, example_data_frame
    )

    stats_dataset_name = example_dataset_stats_hook_obj.get_stats_dataset_name(
        dataset_name
    )

    assert stats_dataset_name in example_dataset_stats_hook_obj._stats
    assert example_dataset_stats_hook_obj._stats[stats_dataset_name]["rows"] == int(
        example_data_frame.shape[0]
    )
    assert example_dataset_stats_hook_obj._stats[stats_dataset_name]["columns"] == int(
        example_data_frame.shape[1]
    )


@pytest.mark.parametrize("dataset_name", ["model_inputs"])
def test_after_dataset_saved(
    dataset_name,
    mocker,
    example_dataset_stats_hook_obj,
    example_catalog,
    example_data_frame,
):
    example_dataset_stats_hook_obj.after_catalog_created(example_catalog)

    # Create a mock object for the 'get_file_size' function
    mock_get_file_size = mocker.Mock()

    # Replace the original 'get_file_size' function with the mock
    mocker.patch(
        "kedro_viz.integrations.kedro.hooks.DatasetStatsHook.get_file_size",
        new=mock_get_file_size,
    )

    # Set the return value of the mock
    mock_get_file_size.return_value = 10

    example_dataset_stats_hook_obj.after_dataset_saved(dataset_name, example_data_frame)

    stats_dataset_name = example_dataset_stats_hook_obj.get_stats_dataset_name(
        dataset_name
    )

    assert stats_dataset_name in example_dataset_stats_hook_obj._stats
    assert example_dataset_stats_hook_obj._stats[stats_dataset_name]["rows"] == int(
        example_data_frame.shape[0]
    )
    assert example_dataset_stats_hook_obj._stats[stats_dataset_name]["columns"] == int(
        example_data_frame.shape[1]
    )
    assert example_dataset_stats_hook_obj._stats[stats_dataset_name]["file_size"] == 10


def test_after_dataset_loaded_with_dataframe_dict(
    example_dataset_stats_hook_obj, example_catalog, example_data_frame
):
    example_dataset_stats_hook_obj.after_catalog_created(example_catalog)

    example_dataset_stats_hook_obj.after_dataset_loaded(
        "companies",
        {"part_1": example_data_frame, "part_2": example_data_frame},
    )

    stats = example_dataset_stats_hook_obj._stats["companies"]
    assert stats["partitions"] == 2
    assert stats["rows"] == int(example_data_frame.shape[0]) * 2
    assert stats["columns"] == int(example_data_frame.shape[1])


def test_after_dataset_saved_with_dataframe_dict(
    mocker, example_dataset_stats_hook_obj, example_catalog, example_data_frame
):
    example_dataset_stats_hook_obj.after_catalog_created(example_catalog)

    mock_get_file_size = mocker.Mock()
    mock_get_file_size.return_value = 10
    mocker.patch(
        "kedro_viz.integrations.kedro.hooks.DatasetStatsHook.get_file_size",
        new=mock_get_file_size,
    )

    example_dataset_stats_hook_obj.after_dataset_saved(
        "model_inputs",
        {"sheet_1": example_data_frame, "sheet_2": example_data_frame},
    )

    stats = example_dataset_stats_hook_obj._stats["model_inputs"]
    assert stats["partitions"] == 2
    assert stats["rows"] == int(example_data_frame.shape[0]) * 2
    assert stats["columns"] == int(example_data_frame.shape[1])
    assert stats["file_size"] == 10


def test_after_dataset_loaded_with_dataframe_dict_mismatched_columns(
    example_dataset_stats_hook_obj, example_catalog, example_data_frame
):
    example_dataset_stats_hook_obj.after_catalog_created(example_catalog)

    example_dataset_stats_hook_obj.after_dataset_loaded(
        "companies",
        {
            "part_1": example_data_frame,
            "part_2": example_data_frame[["id"]],
        },
    )

    stats = example_dataset_stats_hook_obj._stats["companies"]
    assert stats["partitions"] == 2
    assert "columns" not in stats


@pytest.mark.parametrize("data", [{}, [1, 2, 3], "not_a_dataframe", {"a": 1}])
def test_create_dataset_stats_unsupported_data(
    data, example_dataset_stats_hook_obj, example_catalog
):
    example_dataset_stats_hook_obj.after_catalog_created(example_catalog)

    example_dataset_stats_hook_obj.after_dataset_loaded("companies", data)

    assert "companies" not in example_dataset_stats_hook_obj._stats


@pytest.mark.parametrize("dataset_name", ["companies", "companies@pandas1"])
def test_after_pipeline_run(
    dataset_name,
    example_dataset_stats_hook_obj,
    example_data_frame,
    mocker,
    setup_kedro_project,
    caplog,
):
    mocker.patch(
        "kedro_viz.integrations.kedro.hooks._find_kedro_project",
        return_value=setup_kedro_project,
    )
    stats_dataset_name = example_dataset_stats_hook_obj.get_stats_dataset_name(
        dataset_name
    )
    example_dataset_stats_hook_obj._stats = {
        stats_dataset_name: {
            "rows": int(example_data_frame.shape[0]),
            "columns": int(example_data_frame.shape[1]),
        }
    }
    expected_stats_file_path = setup_kedro_project / ".viz/stats.json"
    example_dataset_stats_hook_obj.after_pipeline_run()

    # Check if stats.json file is created
    assert expected_stats_file_path.exists()

    # Verify the contents of the stats.json file
    with expected_stats_file_path.open("r", encoding="utf8") as file:
        data = json.load(file)

    assert data == example_dataset_stats_hook_obj._stats

    # stats file should not get created if it is not a valid kedro project path
    mocker.patch(
        "kedro_viz.integrations.kedro.hooks._find_kedro_project",
        return_value=None,
    )
    example_dataset_stats_hook_obj.after_pipeline_run()
    assert "Could not find a Kedro project to create stats file" in caplog.text


@pytest.mark.parametrize(
    "dataset",
    [MemoryDataset()],
)
def test_get_file_size(dataset, example_dataset_stats_hook_obj, example_csv_dataset):
    assert example_dataset_stats_hook_obj.get_file_size(dataset) is None
    file_path = get_filepath_str(
        example_csv_dataset._filepath, example_csv_dataset._protocol
    )
    assert example_dataset_stats_hook_obj.get_file_size(
        example_csv_dataset
    ) == example_csv_dataset._fs.size(file_path)


def test_get_file_size_file_does_not_exist(example_dataset_stats_hook_obj, mocker):
    class MockDataset:
        def __init__(self):
            self._filepath = "/non/existent/path.csv"

    mock_dataset = MockDataset()
    mock_fs = mocker.Mock()
    mock_fs.exists.return_value = False

    mocker.patch(
        "fsspec.core.url_to_fs",
        return_value=(mock_fs, "/non/existent/path.csv"),
    )

    # Call get_file_size and expect it to return None
    file_size = example_dataset_stats_hook_obj.get_file_size(mock_dataset)
    assert file_size is None


def test_get_file_size_public_filepath(example_dataset_stats_hook_obj, mocker):
    class MockDataset:
        def __init__(self):
            self.filepath = "/path/to/existing/file.csv"

    mock_dataset = MockDataset()

    # Mock fs.exists to return True
    mock_fs = mocker.Mock()
    mock_fs.exists.return_value = True
    mock_fs.isdir.return_value = False
    mock_fs.size.return_value = 456

    mocker.patch(
        "fsspec.core.url_to_fs",
        return_value=(mock_fs, "/path/to/existing/file.csv"),
    )

    # Call get_file_size and expect it to return the mocked file size
    file_size = example_dataset_stats_hook_obj.get_file_size(mock_dataset)
    assert file_size == 456


def test_get_file_size_partitioned_dataset(
    example_dataset_stats_hook_obj, example_partitioned_dataset
):
    fs, path = fsspec.core.url_to_fs(example_partitioned_dataset._path)
    expected_file_size = sum(fs.size(filepath) for filepath in fs.find(path))

    assert (
        example_dataset_stats_hook_obj.get_file_size(example_partitioned_dataset)
        == expected_file_size
    )


def test_get_file_size_directory_with_public_path(
    example_dataset_stats_hook_obj, tmp_path
):
    class MockDataset:
        def __init__(self, path):
            self.path = path

    directory = tmp_path / "partitioned"
    directory.mkdir()
    (directory / "part_1.csv").write_text("a,b\n1,2\n", encoding="utf8")
    (directory / "part_2.csv").write_text("a,b\n3,4\n", encoding="utf8")

    mock_dataset = MockDataset(directory.as_posix())
    expected_file_size = sum(
        (directory / filename).stat().st_size
        for filename in ("part_1.csv", "part_2.csv")
    )

    assert (
        example_dataset_stats_hook_obj.get_file_size(mock_dataset) == expected_file_size
    )
