"""Tests for the runtime data provider seam.

The inspection adapter is the only graph engine: ``get_runtime_data_provider()`` returns the
adapter installed at startup, and raises if none is installed — there is no live-graph fallback.
"""

import pytest

from kedro_viz.api import data_provider
from kedro_viz.api.data_provider import (
    get_runtime_data_provider,
    set_inspection_adapter_provider,
)


@pytest.fixture(autouse=True)
def _reset_adapter_slot():
    """Each test starts with no adapter installed (so leakage between tests is impossible)."""
    set_inspection_adapter_provider(None)
    yield
    set_inspection_adapter_provider(None)


def test_get_runtime_data_provider_returns_installed_adapter() -> None:
    """When an adapter is installed, the factory returns it."""
    sentinel = object()
    set_inspection_adapter_provider(sentinel)  # type: ignore[arg-type]
    assert get_runtime_data_provider() is sentinel


def test_get_runtime_data_provider_raises_when_no_adapter_installed() -> None:
    """Without an adapter there is no fallback — the factory raises a clear error."""
    with pytest.raises(RuntimeError, match="inspection-adapter provider"):
        get_runtime_data_provider()


def test_get_runtime_data_provider_raises_again_after_adapter_cleared() -> None:
    """Clearing the slot reverts to the no-adapter (raising) state."""
    set_inspection_adapter_provider(object())  # type: ignore[arg-type]
    set_inspection_adapter_provider(None)
    with pytest.raises(RuntimeError):
        get_runtime_data_provider()


def test_set_inspection_adapter_provider_round_trip() -> None:
    sentinel = object()
    set_inspection_adapter_provider(sentinel)  # type: ignore[arg-type]
    assert data_provider._adapter_holder.provider is sentinel
    set_inspection_adapter_provider(None)
    assert data_provider._adapter_holder.provider is None
