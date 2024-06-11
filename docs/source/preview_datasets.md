# Preview datasets in Kedro-Viz

To provide users with a glimpse of their datasets within a Kedro project, Kedro-Viz offers a preview feature. 

Currently, Kedro-Viz supports four types of previews:

1. **TablePreview:** For datasets returning tables/dataframes.
2. **JSONPreview:** For datasets returning JSON objects.
3. **PlotlyPreview:** For datasets returning Plotly JSON objects.
4. **ImagePreview:** For datasets returning base64-encoded image strings.

While we currently support the above mentioned datasets, we are soon going to extend this functionality to include other datasets. Users with custom datasets can also expand the preview functionality, which is covered in the section [Extend Preview to Custom Datasets](./preview_custom_datasets.md).

```{note}
Starting from Kedro-Viz 8.0.0, previews are now enabled by default. If you wish to disable it for a specific dataset, refer to the [Disable Preview section](./preview_datasets.md#disabling-previews) for instructions.
```

**Preview tabular data**

See [Preview tabular data in Kedro-Viz](./preview_pandas_datasets.md) for a guide on how you can enable preview on tabular datasets such as `pandas.CSVDataset` and `pandas.ExcelDataset`.

**Preview Plotly Charts**

See [Preview Plotly charts in Kedro-Viz](./preview_plotly_datasets.md) for a guide on how you can create interactive visualizations using `PlotlyDataset` on Kedro-Viz.

**Preview Matplotlib Charts**

See [Preview Matplotlib charts in Kedro-Viz](./preview_matplotlib_datasets.md) for a guide on how you can create static visualizations using `MatplotlibWriterDataset` on Kedro-Viz.

**Extend Preview to custom catasets**

See [Extend Preview to custom catasets](./preview_custom_datasets.md) for a guide on how to set up previews for custom datasets and which types are supported by Kedro-Viz.

```{toctree}
:maxdepth: 1
:hidden:
preview_matplotlib_datasets
preview_plotly_datasets
preview_pandas_datasets
preview_custom_datasets
```



## Disabling Previews


To disable dataset previews for specific datasets, you need to set `preview: false` under the `kedro-viz` key within the `metadata` section of your `catalog.yml` file. Here's an example configuration:

```yaml
companies:
  type: pandas.CSVDataset
  filepath: data/01_raw/companies.csv
  metadata:
    kedro-viz:
      layer: raw
      preview: false
```

```{note}
Starting from Kedro-Viz 9.2.0, previews are disabled by default for the CLI commands `kedro viz deploy` and `kedro viz build`. You can control this behavior using the `--include-previews` flag with these commands. For `kedro viz run`, previews are enabled by default and can be controlled from the publish modal dialog, refer to the [Publish and share](./share_kedro_viz) for more instructions.
```