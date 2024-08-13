import json
from collections import defaultdict

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
    assert example_dataset_stats_hook_obj.datasets == example_catalog._datasets


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
