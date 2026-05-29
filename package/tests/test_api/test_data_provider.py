"""Tests for the runtime data provider.

6.2a introduced the protocol and ``LiveDataProvider``; 6.2b adds the experimental flag, the
adapter-provider slot, and the per-request factory used by ``/api/main`` and
``/api/pipelines/{id}``.
"""

from unittest.mock import patch

import pytest

from kedro_viz.api import data_provider
from kedro_viz.api.data_provider import (
    INSPECTION_ADAPTER_ENV_VAR,
    LiveDataProvider,
    RuntimeDataProvider,
    get_runtime_data_provider,
    is_inspection_adapter_enabled,
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
    """Phase 6.5: the live provider passes itself so the export uses its surface."""
    live = LiveDataProvider()
    with patch("kedro_viz.api.data_provider.save_api_responses_to_fs") as mock:
        live.save_api_responses_to_fs("/tmp/x", "fs", True)
    mock.assert_called_once_with("/tmp/x", "fs", True, provider=live)


# -- 6.2b: experimental flag + factory ---------------------------------------------------- #


@pytest.mark.parametrize(
    "value,expected",
    [
        ("1", True),
        ("true", True),
        ("TRUE", True),
        ("yes", True),
        ("on", True),
        ("  1  ", True),
        ("0", False),
        ("false", False),
        ("", False),
        ("anything-else", False),
    ],
)
def test_is_inspection_adapter_enabled_reads_env_var(
    monkeypatch: pytest.MonkeyPatch, value: str, expected: bool
) -> None:
    monkeypatch.setenv(INSPECTION_ADAPTER_ENV_VAR, value)
    assert is_inspection_adapter_enabled() is expected


def test_is_inspection_adapter_enabled_default_on(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """6.7 flip: with the env var unset, the adapter is on by default."""
    monkeypatch.delenv(INSPECTION_ADAPTER_ENV_VAR, raising=False)
    assert is_inspection_adapter_enabled() is True


def test_get_runtime_data_provider_defaults_to_live_when_no_adapter_installed(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Flag may be on by default (6.7), but with no adapter installed we still fall back to live.

    This is the common path in unit tests: ``_adapter_holder.provider`` is ``None`` because
    nothing built it, so ``get_runtime_data_provider()`` returns ``LiveDataProvider`` regardless
    of the flag.
    """
    monkeypatch.delenv(INSPECTION_ADAPTER_ENV_VAR, raising=False)
    assert isinstance(get_runtime_data_provider(), LiveDataProvider)


def test_get_runtime_data_provider_uses_adapter_when_flag_on_and_installed(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv(INSPECTION_ADAPTER_ENV_VAR, "1")
    sentinel = object()
    set_inspection_adapter_provider(sentinel)  # type: ignore[arg-type]
    assert get_runtime_data_provider() is sentinel


def test_get_runtime_data_provider_falls_back_when_flag_on_but_no_provider(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv(INSPECTION_ADAPTER_ENV_VAR, "1")
    # Slot stays None (cleared by the autouse fixture).
    assert isinstance(get_runtime_data_provider(), LiveDataProvider)


def test_get_runtime_data_provider_falls_back_when_flag_off_even_if_provider_installed(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Explicit opt-out (``=0``) keeps callers on the live path even with an adapter installed."""
    monkeypatch.setenv(INSPECTION_ADAPTER_ENV_VAR, "0")
    set_inspection_adapter_provider(object())  # type: ignore[arg-type]
    assert isinstance(get_runtime_data_provider(), LiveDataProvider)


def test_set_inspection_adapter_provider_round_trip() -> None:
    sentinel = object()
    set_inspection_adapter_provider(sentinel)  # type: ignore[arg-type]
    assert data_provider._adapter_holder.provider is sentinel
    set_inspection_adapter_provider(None)
    assert data_provider._adapter_holder.provider is None
