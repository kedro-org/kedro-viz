"""`kedro_viz.integrations.kedro.telemetry` helps integrate Kedro-Viz with Kedro-Telemetry"""

from pathlib import Path
from typing import Optional

try:
    from kedro_telemetry.plugin import (
        _check_for_telemetry_consent,
        _get_heap_app_id,
        _get_or_create_uuid,
    )

    _IS_TELEMETRY_INSTALLED = True
except ImportError:  # pragma: no cover
    _IS_TELEMETRY_INSTALLED = False


def get_heap_app_id(project_path: Path) -> Optional[str]:
    """Return the Heap App ID used for Kedro telemetry if user has given consent."""
    if not _IS_TELEMETRY_INSTALLED:  # pragma: no cover
        return None

    if _check_for_telemetry_consent(project_path):
        return _get_heap_app_id()
    return None


def get_heap_identity() -> Optional[str]:  # pragma: no cover
    """Reads a UUID from a configuration file or generates and saves a new one if not present."""
    if not _IS_TELEMETRY_INSTALLED:
        return None
    try:
        return _get_or_create_uuid()
    except Exception:  # noqa: BLE001 # pragma: no cover
        return None
