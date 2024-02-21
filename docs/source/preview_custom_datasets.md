# Extend Preview to Custom Datasets

When creating a custom dataset, if you wish to enable data preview for that dataset, you must implement a `preview()` function within the custom dataset class. Kedro-viz currently supports previewing Tables, Plotly charts, Images, and JSON objects.

The return type of the `preview()` function should match one of the following types, as defined in the `kedro-datasets` source code (_typing.py file):

```python
TablePreview = NewType("TablePreview", dict)
ImagePreview = NewType("ImagePreview", bytes)
PlotlyPreview = NewType("PlotlyPreview", dict)
JSONPreview = NewType("JSONPreview", dict)
```

Below is an example demonstrating how to implement the preview() function for a CustomDataset class that utilizes TablePreview to enable previewing tabular data on Kedro-viz:

```python 

from kedro_datasets._typing import TablePreview

class CustomDataset:
    def preview(self, nrows: int = 5) -> TablePreview:
        # Add logic for generating preview
        pass
```