"""`kedro_viz.integrations.kedro.telemetry` helps integrate Kedro Viz with Kedro-Telemetry
"""
import hashlib
import socket
from pathlib import Path
from typing import Optional

import yaml

try:
    from kedro_telemetry.plugin import _get_heap_app_id, _is_valid_syntax

    _IS_TELEMETRY_INSTALLED = True
except ImportError:  # pragma: no cover
    _IS_TELEMETRY_INSTALLED = False


def get_heap_app_id(project_path: Path) -> Optional[str]:
    """Return the Heap App ID used for Kedro telemetry if user has given consent."""
    if not _IS_TELEMETRY_INSTALLED:  # pragma: no cover
        return None
    telemetry_file_path = project_path / ".telemetry"
    if not telemetry_file_path.exists():
        return None
    with open(telemetry_file_path) as telemetry_file:
        telemetry = yaml.safe_load(telemetry_file)
        if _is_valid_syntax(telemetry) and telemetry["consent"]:
            return _get_heap_app_id()
    return None


def get_heap_identity() -> Optional[str]:  # pragma: no cover
    """Return the user ID in heap identical to the id used by kedro-telemetry plugin."""
    if not _IS_TELEMETRY_INSTALLED:
        return None
    try:
        return hashlib.sha512(bytes(socket.gethostname(), encoding="utf8")).hexdigest()
    except socket.timeout:
        return None
