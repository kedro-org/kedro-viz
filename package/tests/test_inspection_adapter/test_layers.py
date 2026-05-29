"""Hermetic tests for the catalog-config layer extractor (no Kedro project load needed)."""

from kedro_viz.integrations.kedro.inspection.layers import extract_layers


def test_extract_layers_reads_metadata_form() -> None:
    config = {
        "companies": {
            "type": "pandas.CSVDataset",
            "metadata": {"kedro-viz": {"layer": "raw"}},
        },
        "shuttles@pandas1": {
            "type": "pandas.ParquetDataset",
            "metadata": {"kedro-viz": {"layer": "intermediate"}},
        },
        "no_layer": {"type": "pandas.CSVDataset"},
    }
    layers = extract_layers(config)
    assert layers["companies"] == "raw"
    assert layers["shuttles"] == "intermediate"  # transcoding stripped
    assert "no_layer" not in layers


def test_extract_layers_ignores_non_dict_and_empty() -> None:
    assert extract_layers({}) == {}
    assert extract_layers({"_anchor": "a string", "x": {"type": "y"}}) == {}
