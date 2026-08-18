"""Tests for the graph data provider slot."""

import pytest

from kedro_viz.api.data_provider import (
    get_graph_data_provider,
    set_graph_data_provider,
)


class _StubProvider:
    """Minimal stand-in satisfying the provider protocol."""

    def get_pipeline_response(self, pipeline_id=None):
        return {"selected_pipeline": pipeline_id}


@pytest.fixture(autouse=True)
def _clear_slot():
    """Leave the process-wide slot empty, so one test cannot leak into the next."""
    set_graph_data_provider(None)
    yield
    set_graph_data_provider(None)


def test_the_slot_installs_and_clears_a_provider() -> None:
    """Installing exposes that provider; clearing puts the slot back to empty."""
    provider = _StubProvider()

    set_graph_data_provider(provider)
    assert get_graph_data_provider() is provider

    set_graph_data_provider(None)
    with pytest.raises(RuntimeError):
        get_graph_data_provider()


def test_missing_provider_raises_with_an_actionable_message() -> None:
    """An empty slot reports how a provider gets installed."""
    with pytest.raises(RuntimeError, match="set_graph_data_provider"):
        get_graph_data_provider()
