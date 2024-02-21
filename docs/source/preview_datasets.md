# Preview datasets in Kedro-Viz

To provide users with a glimpse of their datasets within a Kedro project, Kedro-Viz offers a preview feature. This feature was introduced in Kedro-Viz version 6.3.0 and expanded upon in version 8.0.0. Initially, it supported `CSVDatasets` and `ExcelDatasets`, and later extended to encompass additional dataset types such as `PlotlyDatasets` and image datasets like `MatplotlibWriter`.

Currently, Kedro-Viz supports four types of previews:

1. **TablePreview:** For datasets returning tables/dataframes.
2. **JSONPreview:** For datasets returning JSON objects.
3. **PlotlyPreview:** For datasets returning Plotly JSON objects.
4. **ImagePreview:** For datasets returning base64-encoded image strings.

Whilst we currently support the above datasets. We are soon going to extend this functionality to other datasets. Users with custom datasets can also extend the preview functionality and we will cover that in the following sections. 


**Preview Tabular Data**

The page titled [Preview Tabular Data in Kedro-viz](./preview_pandas_datasets.md) contains a spaceflight tutorial that explains how you can enable preview on Tabular datasets such as `pandas.CSVDataset` and `pandas.ExcelDataset`.

**Preview Plotly Charts**

The page titled [Preview Plotly charts in Kedro-viz](./preview_plotly_datasets.md) contains a spaceflight tutorial that explains how you can create interactive visualizations using `PlotlyDatasets` on Kedro-viz.

**Preview Matplotlib Charts**

The page titled [Preview Matplotlib charts in Kedro-viz](./preview_matplotlib_datasets.md) contains a spaceflight tutorial that explains how you can create static visualizations using `MatplotlibWriterDataset` on Kedro-viz.

**Extend Preview to Custom Datasets**

The page titled [Extend Preview to Custom Datasets](./preview_custom_datasets.md) contains information on how you can set up preview for custom datasets and what types are supported by Kedro-viz.

```{toctree}
:maxdepth: 1
:hidden:
preview_matplotlib_datasets
preview_plotly_datasets
preview_pandas_datasets
preview_custom_datasets
```



## Disabling Previews


To disable dataset previews for specific datasets, you need to set preview: false under the kedro-viz key within the metadata section of your conf.yml file. Here's an example configuration:

```yaml
companies:
  type: pandas.CSVDataSet
  filepath: data/01_raw/companies.csv
  metadata:
    kedro-viz:
      layer: raw
      preview: false
```

