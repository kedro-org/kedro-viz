# Run Status tracking in Kedro-Viz

The Run Status feature in Kedro-Viz provides tracking and visualization of your pipeline execution, giving you detailed insights into your workflow's performance and helping you quickly identify and debug issues.

## Overview

Run Status tracks three main aspects of your pipeline execution:

1. **Pipeline execution**: Overall run status, duration, and timing
2. **Node execution**: Individual node performance, success/failure status, and execution time
3. **Dataset operations**: Dataset loading and saving operations with size information

The feature automatically collects execution data during your `kedro run` and presents it in an intuitive visual format within the Kedro-Viz interface.

## Getting started

### Prerequisites

- Kedro-Viz must be installed in your environment
- Your project must be a valid Kedro project
- Run Status tracking is enabled by default when Kedro-Viz is installed

### Running a pipeline with Run Status tracking

To generate run status data, simply execute your pipeline using the standard Kedro command:

```bash
kedro run
```

This will:
- Execute your pipeline normally
- Automatically collect execution statistics and timing information
- Generate run status data in the `.viz/kedro_pipeline_events.json` file

Once the run is complete, you can visualize the results:

```bash
kedro viz run
```

Navigate to the **Workflow** view to see your run status information.

## Understanding the Workflow view

The Workflow view provides a comprehensive overview of your pipeline execution with the following components:

### Run Status Notification

After a pipeline run, you'll see a notification banner displaying:

- **Success notification**: "Run execution completed successfully in [duration]"
- **Failure notification**: "Run execution failed"
- **Completion timestamp**: When the run finished
- **Duration**: Total execution time (for successful runs)

### Visual status indicators

Each node in the workflow view shows visual indicators:

- **Success**: Green indicators for successfully executed nodes
- **Failure**: Red indicators for failed nodes
- **Not executed**: Gray indicators for nodes that didn't run

### Navigation between views

- **Flowchart view**: Shows the static pipeline structure
- **Workflow view**: Shows the pipeline with run status information
- A status indicator dot appears on the Workflow tab when new run data is available

## Run Status data structure

The Run Status feature tracks the following information:

### Pipeline-level information
- **Run ID**: Unique identifier for each pipeline execution
- **Start time**: When the pipeline execution began
- **End time**: When the pipeline execution completed or failed
- **Duration**: Total execution time
- **Status**: Overall pipeline status (success/failed)
- **Error information**: Detailed error messages and tracebacks for failed runs

### Node-level information
- **Execution status**: Success or failure status for each node
- **Duration**: Time taken to execute each node
- **Error details**: Specific error messages and tracebacks for failed nodes

### Dataset-level information
- **Operation type**: Whether the dataset was loaded or saved
- **Size**: Dataset size in bytes
- **Status**: Success or failure status for dataset operations
- **Error context**: Information about dataset-related errors

## Run Status scenarios

The following examples demonstrate how Run Status appears in different pipeline execution scenarios:

### Successful pipeline execution
![Successful pipeline run](./images/run-status-success.gif)

When all nodes execute successfully, you'll see green indicators and a success notification.

### Node execution failure
![Node execution failure](./images/run-status-node-failure.gif)

When a node fails during execution, you'll see red indicators on the failed node and an error notification.

### Dataset missing error
![Dataset missing error](./images/run-status-dataset-missing.gif)

When a required dataset is missing, the pipeline fails early and shows specific dataset error information.

## Supported pipeline runs

!!! info
    Currently, Run Status tracking is available for **full pipeline runs only**. Partial pipeline runs (using `--from-nodes`, `--to-nodes`, `--tags`, etc.) are not tracked in the current version.

The following run commands are supported:
- `kedro run` (default pipeline)
- `kedro run --pipeline=<pipeline_name>` (named pipeline)

## Troubleshooting

### No run status data available

If you see a "Kedro run not found" message, this typically means:

1. **No pipeline has been executed**: Run `kedro run` to generate run status data
2. **Run events file is missing**: The `.viz/kedro_pipeline_events.json` file may have been deleted
3. **Partial run executed**: Only full pipeline runs are currently tracked

### Run status not updating

If run status information isn't updating after a new run:

1. **Refresh the browser**: The interface may need to be refreshed
2. **Check the run completion**: Ensure the `kedro run` command completed successfully
3. **Verify file permissions**: Check that Kedro-Viz can write to the `.viz` directory

### Performance considerations

For large pipelines:
- Run Status data is stored in JSON format for efficient loading
- The interface automatically handles large datasets with appropriate performance optimizations
- Historical run data is overwritten with each new execution

## API endpoint

The Run Status feature is powered by the `/api/run-status` REST endpoint, which returns structured data about pipeline execution:

```json
{
  "nodes": {
    "node_id": {
      "status": "success",
      "duration": 0.123,
      "error": null
    }
  },
  "datasets": {
    "dataset_id": {
      "name": "dataset_name",
      "size": 1024,
      "status": "success",
      "error": null
    }
  },
  "pipeline": {
    "run_id": "unique-run-id",
    "start_time": "2023-05-14T10:15:30Z",
    "end_time": "2023-05-14T10:20:45Z",
    "duration": 315.25,
    "status": "success",
    "error": null
  }
}
```

## Advanced usage

### Integration with hooks

Run Status tracking is implemented using Kedro hooks and integrates seamlessly with your existing hook setup. The tracking happens automatically without requiring any changes to your pipeline code.

### Error handling

The system provides detailed error information for different types of failures:

- **Node execution errors**: Function-level errors with full tracebacks
- **Dataset errors**: Issues with data loading or saving operations
- **Pipeline errors**: System-level errors that prevent execution

### Data persistence

Run Status data is stored in `.viz/kedro_pipeline_events.json` and includes:
- Timestamped events for each pipeline stage
- Performance metrics and timing information
- Error context for debugging purposes

The file is automatically created and updated with each pipeline run, providing a persistent record of your pipeline's execution history.

!!! tip
    The run status data file is automatically managed by Kedro-Viz. You don't need to manually create or modify this file.

## Best practices

1. **Regular pipeline runs**: Execute `kedro run` regularly to maintain up-to-date run status information
2. **Monitor the Workflow view**: Use the Workflow view to quickly identify performance bottlenecks and failures
3. **Review error details**: Click on failed nodes to see detailed error information in the metadata panel
4. **Performance optimization**: Use duration information to identify slow-running nodes that may need optimization

The Run Status feature is designed to provide immediate, actionable insights into your pipeline execution, helping you build more reliable and efficient data pipelines. 