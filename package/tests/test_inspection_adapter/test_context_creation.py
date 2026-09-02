"""Tests for creating the project-scoped inspection context at server startup."""

from __future__ import annotations

from pathlib import Path
from unittest import mock

import pytest
from kedro.io import DataCatalog, MemoryDataset
from kedro.pipeline import node, pipeline

from kedro_viz.data_access.managers import DataAccessManager
from kedro_viz.server import _create_viz_project_context

PROJECT = Path("/some/project")


def test_cli_options_and_explicit_enrichment_are_forwarded_to_the_context(
    mocker,
) -> None:
    """Startup builds one context from the supplied live data and CLI options."""
    live_data = mocker.MagicMock()
    live_nodes = [mock.sentinel.live_node]
    live_data.nodes.as_list.return_value = live_nodes
    live_data.catalog.layers_mapping = {}
    enrichment = mock.sentinel.enrichment
    from_live_nodes = mocker.patch(
        "kedro_viz.server.EnrichmentSources.from_live_nodes",
        return_value=enrichment,
    )
    context = mock.sentinel.context
    from_project = mocker.patch(
        "kedro_viz.server.VizProjectContext.from_project",
        return_value=context,
    )
    runtime_params = {"split": {"test_size": 0.3}}

    result = _create_viz_project_context(
        PROJECT,
        live_data,
        env="staging",
        pipeline_name="data_ingestion",
        extra_params=runtime_params,
        package_name="spaceflights",
        is_lite=True,
        include_hooks=True,
    )

    from_live_nodes.assert_called_once_with(live_nodes, layer_by_dataset={})
    from_project.assert_called_once_with(
        PROJECT,
        env="staging",
        pipeline_name="data_ingestion",
        runtime_params=runtime_params,
        package_name="spaceflights",
        is_lite=True,
        enrichment=enrichment,
    )
    assert result is context


def test_hook_modified_factory_layer_is_forwarded_to_the_context(mocker) -> None:
    """The hooks path retains metadata on a materialised dataset factory entry."""
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
    live_data = DataAccessManager()
    live_data.add_catalog(catalog, {"__default__": processing_pipeline})
    from_live_nodes = mocker.patch("kedro_viz.server.EnrichmentSources.from_live_nodes")
    mocker.patch("kedro_viz.server.VizProjectContext.from_project")

    _create_viz_project_context(PROJECT, live_data, include_hooks=True)

    from_live_nodes.assert_called_once_with(
        live_data.nodes.as_list(),
        layer_by_dataset={"processing.int_companies": "hooked"},
    )


def test_unmaterialized_factory_layer_is_absent_from_hook_layers(mocker) -> None:
    """An unresolved factory stays absent, matching the populated live catalog."""
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
    live_data = DataAccessManager()
    live_data.add_catalog(catalog, {"__default__": processing_pipeline})
    assert "companies_input" not in catalog.keys()
    from_live_nodes = mocker.patch("kedro_viz.server.EnrichmentSources.from_live_nodes")
    mocker.patch("kedro_viz.server.VizProjectContext.from_project")

    _create_viz_project_context(PROJECT, live_data, include_hooks=True)

    from_live_nodes.assert_called_once_with(
        live_data.nodes.as_list(),
        layer_by_dataset={},
    )


def test_hooks_disabled_keeps_the_raw_catalog_layer_path(mocker) -> None:
    """Without hooks, the builder reads layers from raw config."""
    live_data = mocker.MagicMock()
    live_nodes = [mock.sentinel.live_node]
    live_data.nodes.as_list.return_value = live_nodes
    live_data.catalog.layers_mapping = {"companies": "hooked"}
    from_live_nodes = mocker.patch("kedro_viz.server.EnrichmentSources.from_live_nodes")
    mocker.patch("kedro_viz.server.VizProjectContext.from_project")

    _create_viz_project_context(PROJECT, live_data)

    from_live_nodes.assert_called_once_with(
        live_nodes,
        layer_by_dataset=None,
    )


def test_a_context_build_failure_is_logged_and_re_raised(mocker, caplog) -> None:
    """A failed context build stops startup instead of serving an incomplete graph."""
    live_data = mocker.MagicMock()
    live_data.nodes.as_list.return_value = []
    mocker.patch("kedro_viz.server.EnrichmentSources.from_live_nodes")
    mocker.patch(
        "kedro_viz.server.VizProjectContext.from_project",
        side_effect=RuntimeError("no snapshot"),
    )

    with caplog.at_level("ERROR"), pytest.raises(RuntimeError, match="no snapshot"):
        _create_viz_project_context(PROJECT, live_data)

    assert "Could not build the Kedro inspection context" in caplog.text
