"""Runtime data provider — the single seam every read endpoint and the static-export path share.

Every read goes through a ``RuntimeDataProvider``. Two implementations exist while the legacy
backend is being phased out:

- :class:`LiveDataProvider` — wraps the ``data_access_manager``-backed response builders. The
  legacy path; used when the inspection adapter has not been installed (e.g. construction
  failed because Kedro is too old, ``--params`` was supplied, or in unit tests that don't
  install one).
- ``InspectionAdapterProvider`` (in :mod:`kedro_viz.api.inspection_adapter_provider`) — serves
  the graph + node metadata from a Kedro inspection snapshot. Installed at server startup
  whenever it can be built.

``get_runtime_data_provider()`` is the per-request factory used by the REST routes and the
static-export path: it returns the adapter when one is installed, otherwise the live provider.
Both this seam and the live provider are removed once the legacy backend goes away.
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
    """Legacy provider — delegates to the ``data_access_manager``-backed response builders.

    Routes use this when no inspection-adapter provider has been installed (build failed,
    ``--params`` was supplied, or the test fixture doesn't install one). The legacy code path
    will be removed once the inspection adapter has had a release cycle of real-world use.
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

    Returns the inspection-adapter provider when one has been installed at startup; otherwise
    falls back to :class:`LiveDataProvider`. The legacy fallback exists only for tests and for
    the few cases where the adapter can't be built (e.g. ``--params`` supplied, Kedro too old);
    it will be removed when the legacy backend is removed.
    """
    adapter = _adapter_holder.provider
    if adapter is not None:
        return adapter
    return LiveDataProvider()
