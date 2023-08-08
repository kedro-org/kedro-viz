from unittest import mock

from kedro_viz.integrations.kedro.hooks import dataset_stats_hook


def test_after_dataset_loaded(example_data_frame, dataset_name: str = "raw_data"):
    # Test for pd.dataframe
    assert (
        dataset_stats_hook.after_dataset_loaded(dataset_name, example_data_frame)
        is None
    )
    # Test for Transcoded data node
    transcoded_dataset_name = "raw_data@pandas1"
    assert (
        dataset_stats_hook.after_dataset_loaded(
            transcoded_dataset_name, example_data_frame
        )
        is None
    )


@mock.patch("builtins.open", create=True)
def test_after_pipeline_run(mock_open):
    assert dataset_stats_hook.after_pipeline_run() is None
