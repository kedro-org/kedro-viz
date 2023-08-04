def profiler_order(stats):
    # Custom sort order
    sort_order = ["rows", "columns", "file_size"]
    return {stat: stats.get(stat) for stat in sort_order if stat in stats}
