# Migration from Kedro-Viz native experiment tracking to `kedro-mlflow`

With the deprecation of Kedro-Viz experiment tracking from version 11.0.0, transitioning to [`kedro-mlflow`](https://kedro-mlflow.readthedocs.io/en/stable/) offers enhanced experiment tracking and artifact management. This guide outlines the steps to:

1. **Remove deprecated Kedro-Viz experiment tracking configurations.**
2. **Update existing dataset configurations in the catalog to use `kedro-mlflow`.**
3. **Optionally, delete old experiment tracking data.**

## Remove deprecated Kedro-Viz experiment tracking configurations

### 1. Remove Session Store setup

In `src/<project_name>/settings.py`, locate and remove the session store configuration:

```python
from kedro_viz.integrations.kedro.sqlite_store import SQLiteStore

SESSION_STORE_CLASS = SQLiteStore
SESSION_STORE_ARGS = {"path": str(Path(__file__).parents[2] / "data")}
```

### 2. Remove environment variables
Remove any environment variables associated with collaborative tracking:

```bash
unset KEDRO_SQLITE_STORE_USERNAME
```

### 3. Delete SQLite database
If a `session_store.db` SQLite database was created, you can delete it to clean up your project. This file is typically located in one of the following directories:

- The project root 
- The `.viz` folder within the project root
- The `data` folder

## Update dataset configurations in catalog to use `kedro-mlflow`

Update the dataset configurations in your `catalog.yml` to transition to `kedro-mlflow`. Refer to the table below for the changes:

### Dataset migration table

| Kedro-Viz Dataset Type         | MLflow Dataset Type        | Update Instructions                                      |
|---------------------------------|----------------------------|---------------------------------------------------------|
| `tracking.MetricsDataset`      | `MlflowMetricDataset`      | Update type to [`MlflowMetricDataset`](https://kedro-mlflow.readthedocs.io/en/stable/source/08_API/kedro_mlflow.io.html#kedro_mlflow.io.metrics.mlflow_metric_dataset.MlflowMetricDataset).                  |
| `tracking.JSONDataset`         | `MlflowArtifactDataset`    | Wrap within [`MlflowArtifactDataset`](https://kedro-mlflow.readthedocs.io/en/stable/source/08_API/kedro_mlflow.io.html#kedro_mlflow.io.artifacts.mlflow_artifact_dataset.MlflowArtifactDataset) as `json.JSONDataset`. |
| `plotly.plotlyDataset`         | `MlflowArtifactDataset`    | Wrap within [`MlflowArtifactDataset`](https://kedro-mlflow.readthedocs.io/en/stable/source/08_API/kedro_mlflow.io.html#kedro_mlflow.io.artifacts.mlflow_artifact_dataset.MlflowArtifactDataset) as `plotly.HTMLDataset`. |
| `plotly.JSONDataset`           | `MlflowArtifactDataset`    | Wrap within [`MlflowArtifactDataset`](https://kedro-mlflow.readthedocs.io/en/stable/source/08_API/kedro_mlflow.io.html#kedro_mlflow.io.artifacts.mlflow_artifact_dataset.MlflowArtifactDataset) as `plotly.HTMLDataset`. |
| `matplotlib.MatplotlibWriter`  | `MlflowArtifactDataset`    | Wrap within [`MlflowArtifactDataset`](https://kedro-mlflow.readthedocs.io/en/stable/source/08_API/kedro_mlflow.io.html#kedro_mlflow.io.artifacts.mlflow_artifact_dataset.MlflowArtifactDataset).                   |

### Metrics dataset
For `tracking.MetricsDataset`, update its type to [`MlflowMetricDataset`](https://kedro-mlflow.readthedocs.io/en/stable/source/08_API/kedro_mlflow.io.html#kedro_mlflow.io.metrics.mlflow_metric_dataset.MlflowMetricDataset):

Before:
```yaml
metrics:
  type: tracking.MetricsDataset
  filepath: data/09_tracking/metrics.json
  versioned: true
```

After:
```yaml
metrics:
  type: kedro_mlflow.io.metrics.MlflowMetricDataset
```

### JSON dataset
For `tracking.JSONDataset`, wrap it within [`MlflowArtifactDataset`](https://kedro-mlflow.readthedocs.io/en/stable/source/08_API/kedro_mlflow.io.html#kedro_mlflow.io.artifacts.mlflow_artifact_dataset.MlflowArtifactDataset) and configure it as `json.JSONDataset`:

Before:
```yaml
companies_columns:
  type: tracking.JSONDataset
  filepath: data/09_tracking/json_data.json
  versioned: true
```

After:
```yaml
companies_columns:
  type: kedro_mlflow.io.artifacts.MlflowArtifactDataset
  dataset:
    type: json.JSONDataset
    filepath: data/02_intermediate/companies_columns.json
```

### Plotly dataset
For `plotly.plotlyDataset` and `plotly.JSONDataset`, wrap it within [`MlflowArtifactDataset`](https://kedro-mlflow.readthedocs.io/en/stable/source/08_API/kedro_mlflow.io.html#kedro_mlflow.io.artifacts.mlflow_artifact_dataset.MlflowArtifactDataset) and configure it as `plotly.HTMLDataset` to render interactive plots in the MLflow UI:

Before:
```yaml
plotly_json_data:
  type: plotly.JSONDataset
  filepath: data/09_tracking/plotly.json
```

After:
```yaml
plotly_json_data:
  type: kedro_mlflow.io.artifacts.MlflowArtifactDataset
  dataset:
    type: plotly.HTMLDataset
    filepath: data/08_reporting/plotly.html
```

### Matplotlib writer
For `matplotlib.MatplotlibWriter`, wrap it within [`MlflowArtifactDataset`](https://kedro-mlflow.readthedocs.io/en/stable/source/08_API/kedro_mlflow.io.html#kedro_mlflow.io.artifacts.mlflow_artifact_dataset.MlflowArtifactDataset):

Before:
```yaml
confusion_matrix:
  type: matplotlib.MatplotlibWriter
  filepath: data/09_tracking/confusion_matrix.png
  versioned: true
```

After:
```yaml
confusion_matrix:
  type: kedro_mlflow.io.artifacts.MlflowArtifactDataset
  dataset:
    type: matplotlib.MatplotlibWriter
    filepath: data/08_reporting/confusion_matrix.png
```

## [Optional] Delete old tracking data

Old experiment tracking data stored in `data/09_tracking/` is no longer needed. You can delete this directory to clean up your project:

```bash 
rm -rf data/09_tracking/
```

## Refer to the `kedro-mlflow` documentation for further setup

After completing these steps, refer to the below MLflow documentation to complete your experiment tracking setup with MLflow.

- [The official Kedro + MLflow guide in the Kedro documentation](https://docs.kedro.org/en/stable/integrations/mlflow.html)
- The documentation of [`kedro-mlflow`](https://docs.kedro.org/en/latest/integrations/mlflow.html) plugin 