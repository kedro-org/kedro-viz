"""Tests for building and installing the graph data provider at startup.

``_install_graph_data_provider`` is mocked in ``test_server.py``, so these exercise its body:
what it forwards, what it installs, and what it does when the build fails.
"""

from __future__ import annotations

from pathlib import Path

import pytest
from kedro.io import DataCatalog, MemoryDataset
from kedro.pipeline import node, pipeline

from kedro_viz.api.data_provider import get_graph_data_provider, set_graph_data_provider
from kedro_viz.data_access.managers import DataAccessManager
from kedro_viz.server import _install_graph_data_provider

PROJECT = Path("/some/project")


@pytest.fixture(autouse=True)
def _clear_slot():
    set_graph_data_provider(None)
    yield
    set_graph_data_provider(None)


@pytest.fixture(autouse=True)
def _live_data_access_manager(mocker):
    """Provide the populated catalog state the startup installer expects."""
    manager = mocker.patch("kedro_viz.server.data_access_manager")
    manager.catalog.layers_mapping = {}
    return manager


def test_the_provider_is_built_once_and_installed(mocker) -> None:
    """Startup builds one provider and installs that same instance."""
    adapter = mocker.patch("kedro_viz.server.InspectionAdapterProvider")

    _install_graph_data_provider(PROJECT)

    adapter.assert_called_once()
    assert get_graph_data_provider() is adapter.return_value


def test_cli_options_are_forwarded_to_the_adapter(mocker) -> None:
    """Runtime, lite-mode and hook options must reach the adapter unchanged."""
    adapter = mocker.patch("kedro_viz.server.InspectionAdapterProvider")

    _install_graph_data_provider(
        PROJECT,
        "staging",
        "data_ingestion",
        {"split": {"test_size": 0.3}},
        package_name="spaceflights",
        is_lite=True,
        include_hooks=True,
    )

    adapter.assert_called_once_with(
        PROJECT,
        env="staging",
        pipeline_name="data_ingestion",
        runtime_params={"split": {"test_size": 0.3}},
        package_name="spaceflights",
        is_lite=True,
        layer_by_dataset={},
    )


def test_hook_modified_factory_layer_is_forwarded_to_the_adapter(mocker) -> None:
    """The hooks path must retain metadata on a materialised dataset factory entry."""
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
    manager = DataAccessManager()
    manager.add_catalog(catalog, {"__default__": processing_pipeline})
    mocker.patch("kedro_viz.server.data_access_manager", manager)
    adapter = mocker.patch("kedro_viz.server.InspectionAdapterProvider")

    _install_graph_data_provider(PROJECT, include_hooks=True)

    adapter.assert_called_once_with(
        PROJECT,
        env=None,
        pipeline_name=None,
        runtime_params=None,
        package_name=None,
        is_lite=False,
        layer_by_dataset={"processing.int_companies": "hooked"},
    )


def test_hooks_disabled_keeps_the_raw_catalog_layer_path(
    mocker, _live_data_access_manager
) -> None:
    """Without ``--include-hooks``, the adapter should read layers from raw config."""
    _live_data_access_manager.catalog.layers_mapping = {"companies": "hooked"}
    adapter = mocker.patch("kedro_viz.server.InspectionAdapterProvider")

    _install_graph_data_provider(PROJECT)

    adapter.assert_called_once_with(
        PROJECT,
        env=None,
        pipeline_name=None,
        runtime_params=None,
        package_name=None,
        is_lite=False,
        layer_by_dataset=None,
    )


def test_a_build_failure_is_logged_and_re_raised(mocker, caplog) -> None:
    """A failed provider build is logged and re-raised."""
    mocker.patch(
        "kedro_viz.server.InspectionAdapterProvider",
        side_effect=RuntimeError("no snapshot"),
    )

    with caplog.at_level("ERROR"), pytest.raises(RuntimeError, match="no snapshot"):
        _install_graph_data_provider(PROJECT)

    assert "Could not build the Kedro inspection adapter" in caplog.text


def test_a_build_failure_clears_any_earlier_provider(mocker) -> None:
    """A failed build must leave no provider installed, not the one from the previous build."""
    first = mocker.patch("kedro_viz.server.InspectionAdapterProvider").return_value
    _install_graph_data_provider(PROJECT)
    assert get_graph_data_provider() is first

    mocker.patch(
        "kedro_viz.server.InspectionAdapterProvider",
        side_effect=RuntimeError("broken after edit"),
    )
    with pytest.raises(RuntimeError):
        _install_graph_data_provider(PROJECT)

    with pytest.raises(RuntimeError, match="No graph data provider is installed"):
        get_graph_data_provider()
