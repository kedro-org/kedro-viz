"""Tests for the runtime data provider.

The Protocol + ``LiveDataProvider`` exist while the legacy backend is being phased out; the
inspection adapter is installed at startup unconditionally when it can be built, and the live
provider only fills in when no adapter is available (tests, kedro<1.4.0, ``--params``).
"""

from unittest.mock import patch

import pytest

from kedro_viz.api import data_provider
from kedro_viz.api.data_provider import (
    LiveDataProvider,
    RuntimeDataProvider,
    get_runtime_data_provider,
    set_inspection_adapter_provider,
)


@pytest.fixture(autouse=True)
def _reset_adapter_slot():
    """Each test starts with no adapter installed (so leakage between tests is impossible)."""
    set_inspection_adapter_provider(None)
    yield
    set_inspection_adapter_provider(None)


def test_live_provider_satisfies_the_protocol() -> None:
    assert isinstance(LiveDataProvider(), RuntimeDataProvider)


def test_get_pipeline_response_delegates() -> None:
    with patch(
        "kedro_viz.api.data_provider.get_pipeline_response", return_value="sentinel"
    ) as mock:
        result = LiveDataProvider().get_pipeline_response("foo")
    mock.assert_called_once_with("foo")
    assert result == "sentinel"


def test_get_node_metadata_response_delegates() -> None:
    with patch(
        "kedro_viz.api.data_provider.get_node_metadata_response", return_value="meta"
    ) as mock:
        result = LiveDataProvider().get_node_metadata_response("abc123")
    mock.assert_called_once_with("abc123")
    assert result == "meta"


def test_get_run_status_response_delegates() -> None:
    with patch(
        "kedro_viz.api.data_provider.get_run_status_response", return_value="rs"
    ) as mock:
        result = LiveDataProvider().get_run_status_response()
    mock.assert_called_once_with()
    assert result == "rs"


def test_save_api_responses_to_fs_passes_self_as_provider() -> None:
    """The live provider passes itself so the export uses its surface."""
    live = LiveDataProvider()
    with patch("kedro_viz.api.data_provider.save_api_responses_to_fs") as mock:
        live.save_api_responses_to_fs("/tmp/x", "fs", True)
    mock.assert_called_once_with("/tmp/x", "fs", True, provider=live)


# -- Factory + holder ------------------------------------------------------------------------- #


def test_get_runtime_data_provider_defaults_to_live_when_no_adapter_installed() -> None:
    """Without an adapter installed, the factory returns the legacy live provider."""
    assert isinstance(get_runtime_data_provider(), LiveDataProvider)


def test_get_runtime_data_provider_uses_adapter_when_installed() -> None:
    """When an adapter is installed, the factory returns it."""
    sentinel = object()
    set_inspection_adapter_provider(sentinel)  # type: ignore[arg-type]
    assert get_runtime_data_provider() is sentinel


def test_get_runtime_data_provider_falls_back_when_adapter_is_cleared() -> None:
    """Clearing the slot reverts subsequent calls to the live provider."""
    set_inspection_adapter_provider(object())  # type: ignore[arg-type]
    set_inspection_adapter_provider(None)
    assert isinstance(get_runtime_data_provider(), LiveDataProvider)


def test_set_inspection_adapter_provider_round_trip() -> None:
    sentinel = object()
    set_inspection_adapter_provider(sentinel)  # type: ignore[arg-type]
    assert data_provider._adapter_holder.provider is sentinel
    set_inspection_adapter_provider(None)
    assert data_provider._adapter_holder.provider is None
