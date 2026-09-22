"""Tests for reading kedro-viz layers directly from a live, populated catalog."""

import pytest
from kedro.io import DataCatalog, MemoryDataset
from kedro.pipeline import node, pipeline

from kedro_viz.integrations.kedro.catalog_layers import resolve_live_catalog_layers


def test_layer_is_read_from_dataset_metadata() -> None:
    catalog = DataCatalog.from_config(
        {
            "companies": {
                "type": "kedro.io.MemoryDataset",
                "metadata": {"kedro-viz": {"layer": "raw"}},
            }
        }
    )
    pipelines = {"__default__": pipeline([])}

    assert resolve_live_catalog_layers(catalog, pipelines) == {"companies": "raw"}


def test_dataset_without_metadata_is_absent_from_layers() -> None:
    catalog = DataCatalog.from_config(
        {"companies": {"type": "kedro.io.MemoryDataset"}}
    )
    pipelines = {"__default__": pipeline([])}

    assert resolve_live_catalog_layers(catalog, pipelines) == {}


def test_materialized_factory_layer_is_included() -> None:
    """A factory pattern referenced by a pipeline is resolved so its layer can be read."""
    catalog = DataCatalog.from_config(
        {
            "{namespace}.int_{name}": {
                "type": "kedro.io.MemoryDataset",
                "metadata": {"kedro-viz": {"layer": "intermediate"}},
            }
        }
    )
    processing_pipeline = pipeline(
        [
            node(
                lambda value: value,
                inputs="int_companies",
                outputs="result",
                name="process",
            )
        ],
        namespace="processing",
    )

    layers = resolve_live_catalog_layers(
        catalog, {"__default__": processing_pipeline}
    )

    assert layers == {"processing.int_companies": "intermediate"}


def test_hook_modified_metadata_on_a_materialized_dataset_is_reflected() -> None:
    """Reading `.metadata` off the live dataset picks up whatever a hook last set."""
    catalog = DataCatalog.from_config(
        {
            "{namespace}.int_{name}": {
                "type": "kedro.io.MemoryDataset",
                "metadata": {"kedro-viz": {"layer": "factory"}},
            }
        }
    )
    concrete_dataset = catalog.get("processing.int_companies")
    assert isinstance(concrete_dataset, MemoryDataset)
    assert concrete_dataset.metadata is not None
    concrete_dataset.metadata["kedro-viz"]["layer"] = "hooked"
    processing_pipeline = pipeline(
        [
            node(
                lambda value: value,
                inputs="int_companies",
                outputs="result",
                name="process",
            )
        ],
        namespace="processing",
    )

    layers = resolve_live_catalog_layers(
        catalog, {"__default__": processing_pipeline}
    )

    assert layers == {"processing.int_companies": "hooked"}


def test_unmaterializable_factory_dataset_is_absent_from_layers() -> None:
    """A factory pattern that fails to resolve stays absent, matching the populated catalog."""
    catalog = DataCatalog.from_config(
        {
            "{name}_input": {
                "type": "missing_package.MissingDataset",
                "metadata": {"kedro-viz": {"layer": "raw"}},
            }
        }
    )
    processing_pipeline = pipeline(
        [
            node(
                lambda value: value,
                inputs="companies_input",
                outputs="result",
                name="process",
            )
        ]
    )
    assert "companies_input" not in catalog.keys()

    layers = resolve_live_catalog_layers(
        catalog, {"__default__": processing_pipeline}
    )

    assert layers == {}


def test_transcoded_datasets_with_matching_layers_merge_under_the_base_name() -> None:
    catalog = DataCatalog.from_config(
        {
            "model_inputs@pandas": {
                "type": "pandas.CSVDataset",
                "filepath": "model_inputs.csv",
                "metadata": {"kedro-viz": {"layer": "primary"}},
            },
            "model_inputs@pandas2": {
                "type": "pandas.ParquetDataset",
                "filepath": "model_inputs.parquet",
                "metadata": {"kedro-viz": {"layer": "primary"}},
            },
        }
    )
    pipelines = {"__default__": pipeline([])}

    assert resolve_live_catalog_layers(catalog, pipelines) == {
        "model_inputs": "primary"
    }


def test_transcoded_datasets_with_conflicting_layers_raise() -> None:
    catalog = DataCatalog.from_config(
        {
            "model_inputs@pandas": {
                "type": "pandas.CSVDataset",
                "filepath": "model_inputs.csv",
                "metadata": {"kedro-viz": {"layer": "primary"}},
            },
            "model_inputs@pandas2": {
                "type": "pandas.ParquetDataset",
                "filepath": "model_inputs.parquet",
                "metadata": {"kedro-viz": {"layer": "raw"}},
            },
        }
    )
    pipelines = {"__default__": pipeline([])}

    with pytest.raises(ValueError, match="Transcoded datasets should have the same layer"):
        resolve_live_catalog_layers(catalog, pipelines)
