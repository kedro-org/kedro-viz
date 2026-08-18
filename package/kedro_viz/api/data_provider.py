"""Provide the process-wide graph provider used by graph endpoints."""

from __future__ import annotations

from typing import TYPE_CHECKING, Protocol

if TYPE_CHECKING:
    from fastapi.responses import JSONResponse

    from kedro_viz.api.rest.responses.pipelines import GraphAPIResponse


class GraphDataProvider(Protocol):
    """What the graph endpoints need from whatever is serving them."""

    def get_pipeline_response(
        self, pipeline_id: str | None = None
    ) -> "GraphAPIResponse | JSONResponse": ...


class _ProviderSlot:
    """Holds the provider for this process, mirroring the ``data_access_manager`` singleton."""

    provider: GraphDataProvider | None = None


_slot = _ProviderSlot()


def set_graph_data_provider(provider: GraphDataProvider | None) -> None:
    """Install the graph provider, or clear it with ``None``.

    Args:
        provider: The provider to install, or ``None`` to clear the slot.
    """
    _slot.provider = provider


def get_graph_data_provider() -> GraphDataProvider:
    """Return the installed graph provider.

    Returns:
        The installed graph data provider.

    Raises:
        RuntimeError: If no provider is installed.
    """
    provider = _slot.provider
    if provider is None:
        raise RuntimeError(
            "No graph data provider is installed. The graph endpoints are served from the Kedro "
            "inspection snapshot through a provider that kedro_viz.server.run_server installs at "
            "startup; call set_graph_data_provider before serving them."
        )
    return provider
