"""`kedro_viz.integrations.kedro.utils` contains utility
functions used in the `kedro_viz.integrations.kedro` package"""

from typing import Dict


def stats_order(stats: Dict):
    """Sort the stats extracted from the datasets using the sort order

    Args:
        stats: A dictionary of statistics for a dataset

    Returns: A sorted dictionary based on the sort_order
    """
    # Custom sort order
    sort_order = ["rows", "columns", "file_size"]
    return {stat: stats.get(stat) for stat in sort_order if stat in stats}
