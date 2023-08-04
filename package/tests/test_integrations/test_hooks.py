from unittest import mock
from kedro_viz.integrations.kedro.hooks import dataset_stats_hook


def test_after_catalog_created(example_catalog):
    assert dataset_stats_hook.after_catalog_created(example_catalog) is None


def test_after_dataset_loaded(
    example_data_frame, mock_pandas_series, dataset_name: str = "raw_data"
):
    # Test for pd.dataframe
    assert (
        dataset_stats_hook.after_dataset_loaded(dataset_name, example_data_frame)
        is None
    )
    # Test for list
    assert dataset_stats_hook.after_dataset_loaded(dataset_name, [1, 2, 3]) is None
    # Test for dict
    assert (
        dataset_stats_hook.after_dataset_loaded(dataset_name, {"test": "test_data"})
        is None
    )
    # Test for Pandas Series
    assert (
        dataset_stats_hook.after_dataset_loaded(dataset_name, mock_pandas_series)
        is None
    )


@mock.patch("builtins.open", create=True)
def test_after_pipeline_run(mock_open):
    assert dataset_stats_hook.after_pipeline_run() is None
