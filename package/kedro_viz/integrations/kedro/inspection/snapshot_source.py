"""Load a Kedro project's inspection snapshot and raw config for the adapter.

Thin wrappers around ``kedro.inspection.get_project_snapshot`` (``kedro>=1.4.0``) and the project
config loader; isolating them here keeps the rest of the adapter independent of how snapshots and
config are obtained.
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
    """Mock the project's missing imports in ``sys.modules`` for the duration of the block.

    ``get_project_snapshot`` imports the project's pipeline modules, which pull in node-function
    libraries that may not be installed under ``--lite``. Reusing kedro-viz's ``LiteParser`` to mock
    them lets the snapshot build anyway; its structure comes from the pipeline wiring (not from
    running the stubbed functions), so it stays correct.
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


def _config_loader(
    project_path: str | Path,
    env: str | None,
    runtime_params: dict[str, Any] | None,
) -> Any:
    """Build the project's config loader (no ``DataCatalog``, no session).

    ``runtime_params`` is passed through so ``${runtime_params:...}`` templating in the catalog or
    parameters resolves the same way a live ``--params`` run would.
    """
    from kedro.framework.project import settings
    from kedro.framework.startup import bootstrap_project

    project_path = Path(project_path)
    bootstrap_project(project_path)
    return settings.CONFIG_LOADER_CLASS(
        conf_source=str(project_path / settings.CONF_SOURCE),
        env=env,
        runtime_params=runtime_params or {},
        **settings.CONFIG_LOADER_ARGS,
    )


def load_catalog_config(
    project_path: str | Path,
    env: str | None = None,
    runtime_params: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Return the project's raw catalog config (the inspection snapshot drops it).

    Used to read Viz-only metadata such as layers; no ``DataCatalog`` is materialised.

    Args:
        project_path: Path to the project root (the directory with ``pyproject.toml``).
        env: Optional Kedro environment override; ``None`` uses the project default.
        runtime_params: Parsed ``--params`` overrides for ``${runtime_params:...}`` templating.

    Returns:
        The raw catalog config, or an empty dict if the project has none.
    """
    from kedro.config import MissingConfigException

    try:
        return _config_loader(project_path, env, runtime_params)["catalog"]
    except (KeyError, MissingConfigException):
        return {}


def load_parameters(
    project_path: str | Path,
    env: str | None = None,
    runtime_params: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Return the project's resolved parameter values, with ``--params`` overrides applied.

    The inspection snapshot carries only parameter *names*, so values are read from the config
    loader here (no live project load). ``runtime_params`` is both passed to the loader (for
    ``${runtime_params:...}`` templating) and merged on top of the base values, mirroring how
    ``KedroContext`` applies ``--params``.

    Args:
        project_path: Path to the project root (the directory with ``pyproject.toml``).
        env: Optional Kedro environment override; ``None`` uses the project default.
        runtime_params: Parsed ``--params`` overrides, merged on top of the base values.

    Returns:
        The resolved parameter values.
    """
    from kedro.config import MissingConfigException

    try:
        params = _config_loader(project_path, env, runtime_params)["parameters"]
    except (KeyError, MissingConfigException):
        params = {}
    if runtime_params:
        params = _merge_runtime_params(params, runtime_params)
    return params


def _merge_runtime_params(
    base: dict[str, Any], overrides: dict[str, Any]
) -> dict[str, Any]:
    """Deep-merge ``overrides`` (the parsed ``--params``) onto ``base`` parameter values."""
    merged = dict(base)
    for key, value in overrides.items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = _merge_runtime_params(merged[key], value)
        else:
            merged[key] = value
    return merged
