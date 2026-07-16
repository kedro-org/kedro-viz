"""Unit tests for ``_extract_layers`` (catalog-config layer extraction)."""

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
