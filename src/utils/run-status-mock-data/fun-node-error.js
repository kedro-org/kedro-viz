export const funNodeError = {
    "nodes": {
        "69c523b6": {
            "status": "successful",
            "duration": 0.0196882919408381,
            "error": null
        },
        "ea604da4": {
            "status": "successful",
            "duration": 0.015030583832412958,
            "error": null
        },
        "f33b9291": {
            "status": "successful",
            "duration": 0.04600137518718839,
            "error": null
        },
        "8de402c1": {
            "status": "successful",
            "duration": 0.6291972501203418,
            "error": null
        },
        "cb5166f3": {
            "status": "failed",
            "duration": 0.0,
            "error": {
                "message": "DataFrame.merge() missing 1 required positional argument: 'right'",
                "traceback": "Traceback (most recent call last):\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/runner/task.py\", line 298, in _call_node_run\n    outputs = node.run(inputs)\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/pipeline/node.py\", line 398, in run\n    raise exc\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/pipeline/node.py\", line 386, in run\n    outputs = self._run_with_dict(inputs, self._inputs)\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/pipeline/node.py\", line 443, in _run_with_dict\n    return self._func(**kwargs)\n  File \"/Users/Jitendra_Gundaniya/QB/kedro-viz-run-non-ws/kedro-viz/demo-project/src/demo_project/pipelines/data_ingestion/nodes.py\", line 114, in combine_shuttle_level_information\n    combined_table = rated_shuttles.merge()\nTypeError: DataFrame.merge() missing 1 required positional argument: 'right'\n"
            }
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
            "size": 2937144,
            "status": "available",
            "error": null
        },
        "b5609df0": {
            "name": "params:ingestion.typing.reviews.columns_as_floats",
            "size": 0,
            "status": "available",
            "error": null
        },
        "4f7ffa1b": {
            "name": "ingestion.int_typed_reviews",
            "size": 1334176,
            "status": "available",
            "error": null
        },
        "f1d596c2": {
            "name": "shuttles",
            "size": 4195290,
            "status": "available",
            "error": null
        },
        "c0ddbcbf": {
            "name": "ingestion.int_typed_shuttles@pandas1",
            "size": 1234354,
            "status": "available",
            "error": null
        },
        "8f20d98e": {
            "name": "ingestion.prm_agg_companies",
            "size": 0,
            "status": "available",
            "error": null
        }
    },
    "pipeline": {
        "run_id": "e1883c8c-892c-4bbb-ae4c-b639e3513099",
        "start_time": "2025-06-20T09.54.25.993228Z",
        "end_time": "2025-06-20T09.54.33.160517Z",
        "duration": 0.7099175010807812,
        "status": "failed",
        "error": {
            "message": "DataFrame.merge() missing 1 required positional argument: 'right'",
            "traceback": "Traceback (most recent call last):\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/framework/session/session.py\", line 399, in run\n    run_result = runner.run(\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/runner/runner.py\", line 129, in run\n    self._run(pipeline, catalog, hook_or_null_manager, session_id)  # type: ignore[arg-type]\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/runner/sequential_runner.py\", line 72, in _run\n    super()._run(\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/runner/runner.py\", line 239, in _run\n    ).execute()\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/runner/task.py\", line 88, in execute\n    node = self._run_node_sequential(\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/runner/task.py\", line 164, in _run_node_sequential\n    outputs = self._call_node_run(\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/runner/task.py\", line 308, in _call_node_run\n    raise exc\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/runner/task.py\", line 298, in _call_node_run\n    outputs = node.run(inputs)\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/pipeline/node.py\", line 398, in run\n    raise exc\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/pipeline/node.py\", line 386, in run\n    outputs = self._run_with_dict(inputs, self._inputs)\n  File \"/Users/Jitendra_Gundaniya/miniconda3/envs/viz-run-ws/lib/python3.10/site-packages/kedro/pipeline/node.py\", line 443, in _run_with_dict\n    return self._func(**kwargs)\n  File \"/Users/Jitendra_Gundaniya/QB/kedro-viz-run-non-ws/kedro-viz/demo-project/src/demo_project/pipelines/data_ingestion/nodes.py\", line 114, in combine_shuttle_level_information\n    combined_table = rated_shuttles.merge()\nTypeError: DataFrame.merge() missing 1 required positional argument: 'right'\n"
        }
    }
}