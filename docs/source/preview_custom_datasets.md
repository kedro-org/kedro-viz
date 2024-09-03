# Extend preview to custom datasets

When creating a custom dataset, if you wish to enable data preview for that dataset, you must implement a `preview()` function within the custom dataset class. Kedro-Viz currently supports previewing tables, Plotly charts, images, and JSON objects.

The return type of the `preview()` function should match one of the following types, as defined in the `kedro-datasets` source code ([_typing.py file](https://github.com/kedro-org/kedro-plugins/blob/main/kedro-datasets/kedro_datasets/_typing.py)):

```python
TablePreview = NewType("TablePreview", dict)
ImagePreview = NewType("ImagePreview", bytes)
PlotlyPreview = NewType("PlotlyPreview", dict)
JSONPreview = NewType("JSONPreview", dict)
```

## TablePreview
For `TablePreview`, the returned dictionary must contain the following keys:

`index`: A list of row indices.
`columns`: A list of column names.
`data`: A list of rows, where each row is itself a list of values.

Arbitrary arguments can be included in the `preview()` function, which can be later specified in the `catalog.yml` file. Ensure that these arguments (like `nrows`, `ncolumns`, and `filters`) match the structure of your dataset.

Below is an example demonstrating how to implement the `preview()` function with user-specified arguments for a `CustomDataset` class that utilizes `TablePreview` to enable previewing tabular data on Kedro-Viz:

```yaml 
companies:
  type: CustomDataset
  filepath: ${_base_location}/01_raw/companies.csv
  metadata:
    kedro-viz:
      layer: raw
      preview_args:
        nrows: 5
        ncolumns: 2 
        filters: {
          gender: male 
        } 
```

```python 

from kedro_datasets._typing import TablePreview

class CustomDataset:
  def preview(self, nrows, ncolumns, filters) -> TablePreview:
    data = self.load()
    for column, value in filters.items():
        data = data[data[column] == value]
    subset = data.iloc[:nrows, :ncolumns]
    preview_data = {
        'index': list(subset.index),  # List of row indices
        'columns': list(subset.columns),  # List of column names
        'data': subset.values.tolist()  # List of rows, where each row is a list of values
    }
    return preview_data
```


## Examples of Previews

1. TablePreview 

![](./images/preview_datasets_expanded.png)


2. ImagePreview

![](./images/pipeline_visualisation_matplotlib_expand.png)


3. PlotlyPreview

![](./images/pipeline_visualisation_plotly_expand_1.png)




