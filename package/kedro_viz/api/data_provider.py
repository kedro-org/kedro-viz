"""Runtime data provider — the single seam every read endpoint and the static-export path share.

Decision D11 (Phase 6): rather than spreading flag-conditionals across routes when the inspection
adapter is wired in (6.2b+), every read goes through a ``RuntimeDataProvider``. Two implementations:

- :class:`LiveDataProvider` — wraps today's ``data_access_manager``-backed response builders
  byte-identically; this is the default and what 6.2b will route through when the experimental
  adapter flag is OFF.
- ``InspectionAdapterProvider`` — added in later sub-steps (6.2b–6.5); produces responses from the
  inspection adapter when the flag is ON.

This sub-step (6.2a) introduces only the protocol and the live implementation. **No routes are wired
yet, no flag exists yet** — behaviour is unchanged.
"""

from __future__ import annotations

import logging
import os
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
    """Default provider — delegates to today's live (``data_access_manager``-backed) responses.

    Byte-identical to current behaviour; the routes go through this when the experimental
    adapter flag is OFF (the default).
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


# -- Inspection-adapter flag (Phase 6.2b → 6.7 flip) --------------------------------------- #

logger = logging.getLogger(__name__)

#: Env var that controls the inspection-adapter graph path.
#:
#: **Phase 6.7 (breaking release):** the adapter is now the **default**. Unsetting this variable
#: means the adapter is ON. To opt back into the legacy (``data_access_manager``-backed) graph
#: path for one ``kedro viz run`` invocation, set ``KEDRO_VIZ_INSPECTION_ADAPTER=0`` (or any of
#: ``false`` / ``no`` / ``off``). The opt-out is a temporary safety net — Phase 7 removes the
#: legacy code path entirely and this variable will go away with it.
INSPECTION_ADAPTER_ENV_VAR = "KEDRO_VIZ_INSPECTION_ADAPTER"

_TRUTHY = frozenset({"1", "true", "yes", "on"})


class _AdapterProviderHolder:
    """Holds the optional inspection-adapter provider for this process.

    Wrapping the slot in an instance (rather than a module-level name we reassign) mirrors how
    ``data_access_manager`` is exposed — one instance, state mutated via attribute assignment.
    """

    provider: Optional["RuntimeDataProvider"] = None


_adapter_holder = _AdapterProviderHolder()


def is_inspection_adapter_enabled() -> bool:
    """Whether the inspection adapter is enabled for this process.

    The adapter is **on by default** (6.7). Setting ``KEDRO_VIZ_INSPECTION_ADAPTER`` to any
    falsy value (``0`` / ``false`` / ``no`` / ``off`` / empty string) opts back into the legacy
    graph path. Any other (truthy) value, or leaving it unset, keeps the adapter on.
    """
    value = os.environ.get(INSPECTION_ADAPTER_ENV_VAR)
    if value is None:
        return True
    return value.strip().lower() in _TRUTHY


def set_inspection_adapter_provider(provider: Optional["RuntimeDataProvider"]) -> None:
    """Install (or clear) the adapter provider used when the flag is ON.

    Called from the startup path after the snapshot adapter is built; passing ``None`` reverts to
    the live path. Tests use this to inject a pre-built provider.
    """
    _adapter_holder.provider = provider


def get_runtime_data_provider() -> "RuntimeDataProvider":
    """Return the active runtime data provider for this request.

    Returns the inspection-adapter provider when both: (a) the flag is set, and (b) a provider has
    been installed at startup. Otherwise falls back to :class:`LiveDataProvider`. The flag is
    re-checked per request so tests can toggle behaviour without re-importing.
    """
    adapter = _adapter_holder.provider
    if adapter is not None and is_inspection_adapter_enabled():
        return adapter
    return LiveDataProvider()
