/* eslint-disable camelcase, no-unused-vars */
export const datasetError = {
    "nodes": {
        "69c523b6": {
            "status": "successful",
            "duration": 0.020162458065897226,
            "error": null
        }
    },
    "datasets": {
        "aed46479": {
            "name": "companies",
            "size": 1810602,
            "status": "available",
            "error": null
        },
        "f23ad217": {
            "name": "ingestion.int_typed_companies",
            "size": 550104,
            "status": "available",
            "error": null
        },
        "7b2c6e04": {
            "name": "reviews",
            "size": 0,
            "status": "missing",
            "error": {
                "message": "Failed while loading data from dataset CSVDataset(filepath=/Users/Jitendra_Gundaniya/QB/kedro-viz-run-non-ws/kedro-viz/demo-project/data/01_raw/reviews.csv, load_args={}, protocol=file, save_args={'index': False}).\n[Errno 2] No such file or directory: '/Users/Jitendra_Gundaniya/QB/kedro-viz-run-non-ws/kedro-viz/demo-project/data/01_raw/reviews.csv'",
                "traceback": "Traceback (most recent call last):\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/io/core.py\", line 299, in load\n    return load_func(self)\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro_datasets/pandas/csv_dataset.py\", line 172, in load\n    return pd.read_csv(load_path, **self._load_args)\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/pandas/io/parsers/readers.py\", line 1026, in read_csv\n    return _read(filepath_or_buffer, kwds)\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/pandas/io/parsers/readers.py\", line 620, in _read\n    parser = TextFileReader(filepath_or_buffer, **kwds)\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/pandas/io/parsers/readers.py\", line 1620, in __init__\n    self._engine = self._make_engine(f, self.engine)\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/pandas/io/parsers/readers.py\", line 1880, in _make_engine\n    self.handles = get_handle(\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/pandas/io/common.py\", line 873, in get_handle\n    handle = open(\nFileNotFoundError: [Errno 2] No such file or directory: '/Users/Jitendra_Gundaniya/QB/kedro-viz-run-non-ws/kedro-viz/demo-project/data/01_raw/reviews.csv'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/framework/session/session.py\", line 399, in run\n    run_result = runner.run(\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/runner/runner.py\", line 129, in run\n    self._run(pipeline, catalog, hook_or_null_manager, session_id)  # type: ignore[arg-type]\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/runner/sequential_runner.py\", line 72, in _run\n    super()._run(\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/runner/runner.py\", line 239, in _run\n    ).execute()\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/runner/task.py\", line 88, in execute\n    node = self._run_node_sequential(\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/runner/task.py\", line 152, in _run_node_sequential\n    inputs[name] = catalog.load(name)\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/io/data_catalog.py\", line 408, in load\n    result = dataset.load()\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/io/core.py\", line 306, in load\n    raise DatasetError(message) from exc\nkedro.io.core.DatasetError: Failed while loading data from dataset CSVDataset(filepath=/Users/Jitendra_Gundaniya/QB/kedro-viz-run-non-ws/kedro-viz/demo-project/data/01_raw/reviews.csv, load_args={}, protocol=file, save_args={'index': False}).\n[Errno 2] No such file or directory: '/Users/Jitendra_Gundaniya/QB/kedro-viz-run-non-ws/kedro-viz/demo-project/data/01_raw/reviews.csv'\n",
                "error_node": "ingestion.apply_types_to_reviews",
                "error_operation": "loading"
            }
        }
    },
    "pipeline": {
        "run_id": "633b4813-13d1-4f3c-babe-5023c6f54da9",
        "start_time": "2025-06-18T12.15.04.243870Z",
        "end_time": "2025-06-18T12.15.04.436324Z",
        "duration": 0.020162458065897226,
        "status": "failed",
        "error": {
            "message": "Failed while loading data from dataset CSVDataset(filepath=/Users/Jitendra_Gundaniya/QB/kedro-viz-run-non-ws/kedro-viz/demo-project/data/01_raw/reviews.csv, load_args={}, protocol=file, save_args={'index': False}).\n[Errno 2] No such file or directory: '/Users/Jitendra_Gundaniya/QB/kedro-viz-run-non-ws/kedro-viz/demo-project/data/01_raw/reviews.csv'",
            "traceback": "Traceback (most recent call last):\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/io/core.py\", line 299, in load\n    return load_func(self)\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro_datasets/pandas/csv_dataset.py\", line 172, in load\n    return pd.read_csv(load_path, **self._load_args)\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/pandas/io/parsers/readers.py\", line 1026, in read_csv\n    return _read(filepath_or_buffer, kwds)\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/pandas/io/parsers/readers.py\", line 620, in _read\n    parser = TextFileReader(filepath_or_buffer, **kwds)\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/pandas/io/parsers/readers.py\", line 1620, in __init__\n    self._engine = self._make_engine(f, self.engine)\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/pandas/io/parsers/readers.py\", line 1880, in _make_engine\n    self.handles = get_handle(\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/pandas/io/common.py\", line 873, in get_handle\n    handle = open(\nFileNotFoundError: [Errno 2] No such file or directory: '/Users/Jitendra_Gundaniya/QB/kedro-viz-run-non-ws/kedro-viz/demo-project/data/01_raw/reviews.csv'\n\nThe above exception was the direct cause of the following exception:\n\nTraceback (most recent call last):\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/framework/session/session.py\", line 399, in run\n    run_result = runner.run(\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/runner/runner.py\", line 129, in run\n    self._run(pipeline, catalog, hook_or_null_manager, session_id)  # type: ignore[arg-type]\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/runner/sequential_runner.py\", line 72, in _run\n    super()._run(\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/runner/runner.py\", line 239, in _run\n    ).execute()\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/runner/task.py\", line 88, in execute\n    node = self._run_node_sequential(\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/runner/task.py\", line 152, in _run_node_sequential\n    inputs[name] = catalog.load(name)\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/io/data_catalog.py\", line 408, in load\n    result = dataset.load()\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/io/core.py\", line 306, in load\n    raise DatasetError(message) from exc\nkedro.io.core.DatasetError: Failed while loading data from dataset CSVDataset(filepath=/Users/Jitendra_Gundaniya/QB/kedro-viz-run-non-ws/kedro-viz/demo-project/data/01_raw/reviews.csv, load_args={}, protocol=file, save_args={'index': False}).\n[Errno 2] No such file or directory: '/Users/Jitendra_Gundaniya/QB/kedro-viz-run-non-ws/kedro-viz/demo-project/data/01_raw/reviews.csv'\n"
        }
    }
}
