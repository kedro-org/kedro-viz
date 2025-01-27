# Migration from Kedro-Viz Native Experiment Tracking to Kedro-MLflow

With the deprecation of Kedro-Viz experiment tracking from version 11.0.0, transitioning to [Kedro-MLflow](https://kedro-mlflow.readthedocs.io/en/stable/) offers enhanced experiment tracking and artifact management. This guide outlines the steps to:

1. **Remove deprecated configurations related to Kedro-Viz experiment tracking.**
2. **Update existing dataset configurations in the catalog.**
3. **Optionally, delete old experiment tracking data.**
4. **Refer to MLflow documentation for further setup.**

## Step 1: Remove deprecated configurations related to Kedro-Viz experiment tracking

### a. Remove Session Store Setup

In `src/<project_name>/settings.py`, locate and remove the session store configuration:

```python
from kedro_viz.integrations.kedro.sqlite_store import SQLiteStore

SESSION_STORE_CLASS = SQLiteStore
SESSION_STORE_ARGS = {"path": str(Path(__file__).parents[2] / "data")}
```

### b. Remove Environment Variables
Remove any environment variables associated with collaborative tracking:

```bash
export KEDRO_SQLITE_STORE_USERNAME="your_unique_username"
```

### c. Delete SQLite Database
If a session_store.db SQLite database was created, delete it. Typically, it is located in the project root or under the data directory.


## Step 2: Update Dataset Configurations in Catalog

Update the dataset configurations in your `catalog.yml` to transition to `kedro-mlflow`. Refer to the table below for the changes:

### Dataset Migration Table

| Kedro-Viz Dataset Type         | MLflow Dataset Type        | Update Instructions                                      |
|---------------------------------|----------------------------|---------------------------------------------------------|
| `tracking.MetricsDataset`      | `MlflowMetricDataset`      | Update type to `MlflowMetricDataset`.                  |
| `tracking.JSONDataset`         | `MlflowArtifactDataset`    | Wrap within `MlflowArtifactDataset` as `json.JSONDataset`. |
| `plotly.plotlyDataset`         | `MlflowArtifactDataset`    | Wrap within `MlflowArtifactDataset` as `plotly.HTMLDataset`. |
| `plotly.JSONDataset`           | `MlflowArtifactDataset`    | Wrap within `MlflowArtifactDataset` as `plotly.HTMLDataset`. |
| `matplotlib.MatplotlibWriter`  | `MlflowArtifactDataset`    | Wrap within `MlflowArtifactDataset`.                   |




### a. Metrics Dataset
For `tracking.MetricsDataset`, update its type to `MlflowMetricDataset`:

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

### b. JSON Dataset
For `tracking.JSONDataset`, wrap it within `MlflowArtifactDataset` and configure it as `json.JSONDataset`:

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

### c. Plotly Dataset
For `plotly.plotlyDataset` and `plotly.JSONDataset`, wrap it within `MlflowArtifactDataset` and configure it as `plotly.HTMLDataset` to render interactive plots in the MLflow UI:

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

### d. Matplotlib Writer
For `matplotlib.MatplotlibWriter`, wrap it within `MlflowArtifactDataset`:

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
    filepath: data/07_reporting/confusion_matrix.png
```

## Step 3: [Optional] Delete Old Tracking Data

Old experiment tracking data stored in data/09_tracking/ is no longer needed. You can delete this directory to clean up your project:

```bash 
rm -rf data/09_tracking/
```

## Step 4: Refer to MLflow documentation for further setup

After completing these steps, refer to the below Mlflow documentation to complete your experiment tracking setup with MLflow.

- [The official Kedro + MLflow guide in the Kedro documentation](https://docs.kedro.org/en/stable/integrations/mlflow.html)
- The documentation of [`kedro-mlflow`](https://docs.kedro.org/en/latest/integrations/mlflow.html) plugin 