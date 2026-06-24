"""Runtime data provider — the single seam every read endpoint and the static export share.

Every read goes through the :class:`InspectionAdapterProvider`, which serves the graph + node
metadata from a Kedro inspection snapshot. It is installed at startup whenever it can be built,
which is every ``kedro viz run`` invocation on kedro>=1.4.0.

``get_runtime_data_provider()`` is the per-request factory: it returns the installed adapter, and
raises if none is installed. There is intentionally no live-graph fallback — the snapshot adapter
is the only graph engine. (Tests inject a provider via ``set_inspection_adapter_provider``.)
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any, Optional, Protocol, Union, runtime_checkable

from fastapi.responses import JSONResponse

from kedro_viz.api.rest.responses.pipelines import GraphAPIResponse
from kedro_viz.api.rest.responses.run_events import RunStatusAPIResponse

if TYPE_CHECKING:
    from kedro_viz.api.rest.responses.nodes import NodeMetadataAPIResponse


@runtime_checkable
class RuntimeDataProvider(Protocol):
    """The runtime data surface every read endpoint and the static-export path depend on.

    Implemented by ``InspectionAdapterProvider`` from the snapshot + live-object bridge.
    """

    def get_pipeline_response(
        self, pipeline_id: Optional[str] = None
    ) -> Union[GraphAPIResponse, JSONResponse]: ...

    def get_pipeline_ids(self) -> list[str]: ...

    def get_node_ids(self) -> list[str]: ...

    def get_node_metadata_response(
        self, node_id: str
    ) -> Union[NodeMetadataAPIResponse, JSONResponse]: ...

    def get_run_status_response(self) -> RunStatusAPIResponse: ...

    def save_api_responses_to_fs(
        self, path: str, remote_fs: Any, is_all_previews_enabled: bool
    ) -> None: ...


# -- Inspection-adapter provider slot ------------------------------------------------------ #

logger = logging.getLogger(__name__)


class _AdapterProviderHolder:
    """Holds the inspection-adapter provider for this process (mirrors the
    ``data_access_manager`` singleton pattern)."""

    provider: Optional["RuntimeDataProvider"] = None


_adapter_holder = _AdapterProviderHolder()


def set_inspection_adapter_provider(provider: Optional["RuntimeDataProvider"]) -> None:
    """Install (or clear) the inspection-adapter provider for this process.

    Called from the startup path after the adapter is built. Passing ``None`` clears the slot.
    Tests use this to inject a pre-built provider.
    """
    _adapter_holder.provider = provider


def get_runtime_data_provider() -> "RuntimeDataProvider":
    """Return the active runtime data provider for this request.

    Returns the inspection-adapter provider installed at startup. Raises if none is installed —
    there is no live-graph fallback; the snapshot adapter is the only graph engine.
    """
    adapter = _adapter_holder.provider
    if adapter is None:
        raise RuntimeError(
            "No inspection-adapter provider is installed. Kedro-Viz serves the graph only from "
            "the Kedro inspection snapshot (kedro>=1.4.0); the adapter must be built at startup. "
            "This usually means the adapter failed to build — check the startup logs."
        )
    return adapter
