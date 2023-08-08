"""`kedro_viz.integrations.kedro.utils` contains utility
functions used in the `kedro_viz.integrations.kedro` package"""

from kedro.pipeline.pipeline import TRANSCODING_SEPARATOR, _strip_transcoding


def stats_order(stats: dict) -> dict:
    """Sort the stats extracted from the datasets using the sort order

    Args:
        stats: A dictionary of statistics for a dataset

    Returns: A sorted dictionary based on the sort_order
    """
    # Custom sort order
    sort_order = ["rows", "columns", "file_size"]
    return {stat: stats.get(stat) for stat in sort_order if stat in stats}


def get_stats_dataset_name(dataset_name: str):
    """Get the dataset name for assigning stat values in the dictionary.
    If the dataset name contains transcoded information, strip the transcoding.

    Args:
        dataset_name: name of the dataset

    Returns: Dataset name without any transcoding information
    """

    stats_dataset_name = dataset_name

    # Strip transcoding
    is_transcoded_dataset = TRANSCODING_SEPARATOR in dataset_name
    if is_transcoded_dataset:
        stats_dataset_name = _strip_transcoding(dataset_name)

    return stats_dataset_name
