"""Load a Kedro project inspection snapshot.

Thin wrapper around ``kedro.inspection.get_project_snapshot`` (``kedro>=1.4.0``).

The local Python API is the only supported source: the HTTP/REST snapshot endpoint was
reverted upstream (kedro#5570), so remote snapshots are intentionally not handled here.
Keeping the source behind this module isolates the rest of the adapter from how snapshots
are obtained.
"""

from __future__ import annotations

import logging
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from kedro.inspection.models import ProjectSnapshot

logger = logging.getLogger(__name__)


@contextmanager
def lite_import_stubs(
    project_path: str | Path, package_name: str | None = None
) -> Iterator[None]:
    """Mock the project's unresolved imports in ``sys.modules`` for the duration of the block.

    ``kedro.inspection.get_project_snapshot`` is **not import-free**: it imports the project's
    pipeline modules to read their structure, which pulls in node-function libraries (pandas,
    sklearn, ...). Under ``--lite`` those may not be installed. This reuses kedro-viz's
    :class:`~kedro_viz.integrations.kedro.lite_parser.LiteParser` — the same mechanism the live
    ``--lite`` loader uses — to mock the missing modules so the snapshot can still be built. The
    snapshot's structure (node names, inputs, outputs) comes from the pipeline *wiring*, not from
    executing the stubbed functions, so it stays correct; dataset types come from the catalog
    config, so mocking dataset libraries does not corrupt them either.
    """
    import sys
    from unittest.mock import patch

    from kedro_viz.integrations.kedro.lite_parser import LiteParser
    from kedro_viz.models.metadata import Metadata

    lite_parser = LiteParser(package_name)
    unresolved = lite_parser.parse(Path(project_path)) or {}
    modules_to_mock: set[str] = set()
    for module_set in unresolved.values():
        modules_to_mock |= module_set

    sys_modules_patch = sys.modules.copy()
    if modules_to_mock:
        # Same banner the live --lite loader sets, so the UI flags limited functionality.
        Metadata.set_has_missing_dependencies(True)
        sys_modules_patch.update(lite_parser.create_mock_modules(modules_to_mock))
        logger.warning(
            "Kedro-Viz --lite: building the snapshot with %d project dependency module(s) "
            "mocked. Install them for full functionality:\n%s",
            len(modules_to_mock),
            sorted(modules_to_mock),
        )

    with patch.dict("sys.modules", sys_modules_patch):
        yield


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
