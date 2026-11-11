"""Tests for creating the project-scoped inspection context at server startup."""

from __future__ import annotations

from pathlib import Path
from unittest import mock

import pytest

from kedro_viz.server import _create_viz_project_context

PROJECT = Path("/some/project")


def test_cli_options_and_layers_are_forwarded_to_the_context(mocker) -> None:
    """Startup builds one context from CLI options and any resolved layers."""
    enrichment = mock.sentinel.enrichment
    load_enrichment = mocker.patch(
        "kedro_viz.server.load_enrichment_sources",
        return_value=enrichment,
    )
    context = mock.sentinel.context
    from_project = mocker.patch(
        "kedro_viz.server.VizProjectContext.from_project",
        return_value=context,
    )
    runtime_params = {"split": {"test_size": 0.3}}
    layers = {"companies": "hooked"}

    result = _create_viz_project_context(
        PROJECT,
        env="staging",
        pipeline_name="data_ingestion",
        extra_params=runtime_params,
        package_name="spaceflights",
        is_lite=True,
        layer_by_dataset_name=layers,
    )

    load_enrichment.assert_called_once_with(
        PROJECT,
        layer_by_dataset_name=layers,
    )
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


def test_no_layers_forwards_none_so_the_builder_reads_the_raw_catalog(mocker) -> None:
    """Absent (rather than empty) layers tells the builder to read the raw catalog config."""
    enrichment = mock.sentinel.enrichment
    load_enrichment = mocker.patch(
        "kedro_viz.server.load_enrichment_sources",
        return_value=enrichment,
    )
    from_project = mocker.patch("kedro_viz.server.VizProjectContext.from_project")

    _create_viz_project_context(PROJECT)

    load_enrichment.assert_called_once_with(PROJECT, layer_by_dataset_name=None)
    from_project.assert_called_once()


def test_a_context_build_failure_is_logged_and_re_raised(mocker, caplog) -> None:
    """A failed context build stops startup instead of serving an incomplete graph."""
    mocker.patch("kedro_viz.server.load_enrichment_sources")
    mocker.patch(
        "kedro_viz.server.VizProjectContext.from_project",
        side_effect=RuntimeError("no snapshot"),
    )

    with caplog.at_level("ERROR"), pytest.raises(RuntimeError, match="no snapshot"):
        _create_viz_project_context(PROJECT)

    assert "Could not build the Kedro inspection context" in caplog.text
