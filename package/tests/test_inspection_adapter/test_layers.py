"""Unit tests for ``_extract_layers`` (catalog-config layer extraction)."""

import pytest

from kedro_viz.integrations.kedro.inspection.layers import _extract_layers


def test_reads_kedro_viz_layer() -> None:
    config = {
        "companies": {
            "type": "pandas.CSVDataset",
            "metadata": {"kedro-viz": {"layer": "raw"}},
        }
    }
    assert _extract_layers(config) == {"companies": "raw"}


def test_strips_transcoding() -> None:
    config = {"shuttles@pandas": {"metadata": {"kedro-viz": {"layer": "primary"}}}}
    assert _extract_layers(config) == {"shuttles": "primary"}


def test_resolves_dataset_factory_layer() -> None:
    config = {
        "{namespace}.int_{name}": {
            "type": "pandas.ParquetDataset",
            "metadata": {"kedro-viz": {"layer": "intermediate"}},
        }
    }
    assert _extract_layers(config, ["processing.int_companies"]) == {
        "processing.int_companies": "intermediate"
    }


def test_explicit_dataset_takes_precedence_over_factory_layer() -> None:
    config = {
        "{name}": {
            "type": "pandas.ParquetDataset",
            "metadata": {"kedro-viz": {"layer": "factory"}},
        },
        "companies": {
            "type": "pandas.CSVDataset",
            "metadata": {"kedro-viz": {"layer": "raw"}},
        },
    }
    assert _extract_layers(config, ["companies"]) == {"companies": "raw"}


def test_more_specific_factory_without_layer_takes_precedence() -> None:
    config = {
        "{name}": {
            "type": "pandas.ParquetDataset",
            "metadata": {"kedro-viz": {"layer": "factory"}},
        },
        "{namespace}.int_{name}": {"type": "pandas.ParquetDataset"},
    }
    assert _extract_layers(config, ["processing.int_companies"]) == {}


def test_skips_entries_without_a_layer() -> None:
    config = {
        "no_metadata": {"type": "pandas.CSVDataset"},  # KeyError on "metadata"
        "metadata_without_layer": {
            "metadata": {"kedro-viz": {}}
        },  # KeyError on "layer"
    }
    assert _extract_layers(config) == {}


def test_skips_non_dict_config() -> None:
    # A non-mapping entry (e.g. a stray string) must be ignored, not crash.
    config = {
        "_stray": "not-a-dict",
        "companies": {"metadata": {"kedro-viz": {"layer": "raw"}}},
    }
    assert _extract_layers(config) == {"companies": "raw"}


def test_transcoded_variants_with_same_layer_collapse_to_one() -> None:
    config = {
        "cars@csv": {"metadata": {"kedro-viz": {"layer": "raw"}}},
        "cars@parquet": {"metadata": {"kedro-viz": {"layer": "raw"}}},
    }
    assert _extract_layers(config) == {"cars": "raw"}


def test_transcoded_variants_with_conflicting_layers_raise() -> None:
    config = {
        "cars@csv": {"metadata": {"kedro-viz": {"layer": "raw"}}},
        "cars@parquet": {"metadata": {"kedro-viz": {"layer": "model"}}},
    }
    with pytest.raises(
        ValueError, match="Transcoded datasets should have the same layer"
    ):
        _extract_layers(config)
