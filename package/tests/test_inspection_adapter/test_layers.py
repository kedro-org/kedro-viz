"""Tests for inspection-adapter layer handling."""

import logging

import pytest

from kedro_viz.integrations.kedro.inspection.layers import _extract_layers, sort_layers


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


def test_sort_layers_returns_empty_when_no_nodes_have_layers() -> None:
    assert (
        sort_layers(
            {"input": None, "task": None, "output": None},
            {"input": {"task"}, "task": {"output"}},
        )
        == []
    )


def test_sort_layers_follows_indirect_dependencies() -> None:
    assert sort_layers(
        {"input": "raw", "task": None, "output": "intermediate"},
        {"input": {"task"}, "task": {"output"}},
    ) == ["raw", "intermediate"]


@pytest.mark.parametrize(
    "layer_by_node_id,dependencies,expected",
    [
        (
            {
                "raw": "raw",
                "split": None,
                "intermediate": "intermediate",
                "feature": "feature",
                "model_input": "model_input",
            },
            {
                "raw": {"split"},
                "split": {"intermediate"},
                "intermediate": {"feature", "model_input"},
            },
            ["raw", "intermediate", "feature", "model_input"],
        ),
        (
            {"node_1": "c", "node_2": "a", "node_3": "d", "node_4": "b"},
            {"node_1": {"node_2"}, "node_3": {"node_4"}},
            ["c", "d", "a", "b"],
        ),
    ],
)
def test_sort_layers_is_deterministic(
    layer_by_node_id: dict[str, str | None],
    dependencies: dict[str, set[str]],
    expected: list[str],
) -> None:
    assert sort_layers(layer_by_node_id, dependencies) == expected


def test_sort_layers_returns_empty_on_cyclic_layers(
    caplog: pytest.LogCaptureFixture,
) -> None:
    with caplog.at_level(
        logging.WARNING,
        logger="kedro_viz.integrations.kedro.inspection.layers",
    ):
        result = sort_layers(
            {"first": "raw", "second": "intermediate", "third": "raw"},
            {
                "first": {"second"},
                "second": {"third"},
                "third": {"first"},
            },
        )

    assert result == []
    assert "circular dependency detected among layers" in caplog.text


def test_sort_layers_rejects_unknown_dependency_nodes() -> None:
    with pytest.raises(KeyError, match="missing"):
        sort_layers({"source": "raw"}, {"source": {"missing"}})
