"""Load a Kedro project inspection snapshot.

Thin wrapper around ``kedro.inspection.get_project_snapshot`` (``kedro>=1.4.0``).

The local Python API is the only supported source: the HTTP/REST snapshot endpoint was
reverted upstream (kedro#5570), so remote snapshots are intentionally not handled here.
Keeping the source behind this module isolates the rest of the adapter from how snapshots
are obtained.
"""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from kedro.inspection.models import ProjectSnapshot


def is_inspection_available() -> bool:
    """Return whether the installed Kedro provides the inspection API."""
    try:
        from kedro.inspection import get_project_snapshot  # noqa: F401
    except ImportError:
        return False
    return True


def load_snapshot(project_path: str | Path, env: str | None = None) -> ProjectSnapshot:
    """Return a read-only inspection snapshot for the project at ``project_path``.

    Args:
        project_path: Path to the project root (the directory with ``pyproject.toml``).
        env: Optional Kedro environment override; ``None`` uses the project default.

    Returns:
        The Kedro ``ProjectSnapshot``.

    Raises:
        RuntimeError: if the installed Kedro has no inspection API (``kedro<1.4.0``).
    """
    try:
        from kedro.inspection import get_project_snapshot
    except ImportError as exc:
        raise RuntimeError(
            "Kedro inspection API is unavailable; the inspection adapter path "
            "requires kedro>=1.4.0."
        ) from exc

    return get_project_snapshot(project_path=Path(project_path), env=env)


def load_catalog_config(
    project_path: str | Path, env: str | None = None
) -> dict[str, Any]:
    """Return the project's raw catalog config (the snapshot drops layer metadata, Phase 4).

    Layers live under each dataset's ``metadata.kedro-viz.layer`` in the catalog config but are not
    part of ``ProjectSnapshot``, so they are read here from config (no ``DataCatalog`` is
    materialised). Returns an empty dict if no catalog config is present.
    """
    from kedro.config import MissingConfigException
    from kedro.framework.project import settings
    from kedro.framework.startup import bootstrap_project

    project_path = Path(project_path)
    bootstrap_project(project_path)
    config_loader = settings.CONFIG_LOADER_CLASS(
        conf_source=str(project_path / settings.CONF_SOURCE),
        env=env,
        **settings.CONFIG_LOADER_ARGS,
    )
    try:
        return config_loader["catalog"]
    except (KeyError, MissingConfigException):
        return {}
