"""Runtime data provider — the single seam every read endpoint and the static-export path share.

Every read goes through a ``RuntimeDataProvider``. Two implementations coexist by design:

- ``InspectionAdapterProvider`` (in :mod:`kedro_viz.api.inspection_adapter_provider`) — the
  default. Serves the graph + node metadata from a Kedro inspection snapshot. Installed at
  server startup whenever it can be built, which is every case except the one below.
- :class:`LiveDataProvider` — the **runtime-params path**. Wraps the ``data_access_manager``-backed
  response builders. Used when the adapter is deliberately not installed: ``kedro viz run
  --params=...`` (the inspection snapshot API has no runtime-params route, so a project whose
  catalog/parameters depend on ``--params`` must be served from a live load — see D14). It is
  also the safety net if the adapter unexpectedly fails to build, and what unit tests that don't
  install an adapter fall back to.

``get_runtime_data_provider()`` is the per-request factory used by the REST routes and the
static-export path: it returns the adapter when one is installed, otherwise the live provider.

This seam is **retained, not scaffolding**: as long as ``--params`` is served by the live load,
the routes need a single place to choose between the two engines, and this is it. Full removal of
the live path would only be revisited if the inspection snapshot API ever grows a runtime-params
route. (The other historical fallback reason — Kedro older than the inspection API — no longer
applies; ``kedro>=1.4.0`` is now the floor.)
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any, Optional, Protocol, Union, runtime_checkable

from fastapi.responses import JSONResponse

from kedro_viz.api.rest.responses.nodes import get_node_metadata_response
from kedro_viz.api.rest.responses.pipelines import (
    GraphAPIResponse,
    get_pipeline_response,
)
from kedro_viz.api.rest.responses.run_events import (
    RunStatusAPIResponse,
    get_run_status_response,
)
from kedro_viz.api.rest.responses.save_responses import save_api_responses_to_fs
from kedro_viz.data_access import data_access_manager

if TYPE_CHECKING:
    from kedro_viz.api.rest.responses.nodes import NodeMetadataAPIResponse


@runtime_checkable
class RuntimeDataProvider(Protocol):
    """The runtime data surface every read endpoint and the static-export path depend on.

    Mirrors the existing module-level response builders; ``InspectionAdapterProvider``
    implements the same surface from the snapshot + live-object bridge.
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


class LiveDataProvider:
    """Runtime-params provider — delegates to the ``data_access_manager``-backed response builders.

    Routes use this when no inspection-adapter provider has been installed. In normal operation
    that means ``kedro viz run --params=...``: the snapshot API can't reflect runtime params, so
    the graph + metadata are served from a live project load instead (D14). It is also the
    fallback if the adapter unexpectedly fails to build, and what test fixtures that don't install
    an adapter use. This path is retained for the runtime-params case — it is not pending removal.
    """

    def get_pipeline_response(
        self, pipeline_id: Optional[str] = None
    ) -> Union[GraphAPIResponse, JSONResponse]:
        return get_pipeline_response(pipeline_id)

    def get_pipeline_ids(self) -> list[str]:
        return data_access_manager.registered_pipelines.get_pipeline_ids()

    def get_node_ids(self) -> list[str]:
        return data_access_manager.nodes.get_node_ids()

    def get_node_metadata_response(
        self, node_id: str
    ) -> Union[NodeMetadataAPIResponse, JSONResponse]:
        return get_node_metadata_response(node_id)

    def get_run_status_response(self) -> RunStatusAPIResponse:
        return get_run_status_response()

    def save_api_responses_to_fs(
        self, path: str, remote_fs: Any, is_all_previews_enabled: bool
    ) -> None:
        save_api_responses_to_fs(
            path, remote_fs, is_all_previews_enabled, provider=self
        )


# -- Inspection-adapter provider slot ------------------------------------------------------ #

logger = logging.getLogger(__name__)


class _AdapterProviderHolder:
    """Holds the optional inspection-adapter provider for this process.

    Wrapping the slot in an instance (rather than a module-level name we reassign) mirrors how
    ``data_access_manager`` is exposed — one instance, state mutated via attribute assignment.
    """

    provider: Optional["RuntimeDataProvider"] = None


_adapter_holder = _AdapterProviderHolder()


def set_inspection_adapter_provider(provider: Optional["RuntimeDataProvider"]) -> None:
    """Install (or clear) the inspection-adapter provider for this process.

    Called from the startup path after the adapter is built. Passing ``None`` clears the slot,
    which means subsequent reads will go through :class:`LiveDataProvider`. Tests use this to
    inject a pre-built provider.
    """
    _adapter_holder.provider = provider


def get_runtime_data_provider() -> "RuntimeDataProvider":
    """Return the active runtime data provider for this request.

    Returns the inspection-adapter provider when one has been installed at startup (the default
    for every ``kedro viz run`` invocation); otherwise returns :class:`LiveDataProvider`. The
    live provider is the intentional path for ``--params`` (no runtime-params route exists in the
    snapshot API — D14) and the safety net for an unexpected adapter build failure or for tests
    that don't install an adapter.
    """
    adapter = _adapter_holder.provider
    if adapter is not None:
        return adapter
    return LiveDataProvider()
