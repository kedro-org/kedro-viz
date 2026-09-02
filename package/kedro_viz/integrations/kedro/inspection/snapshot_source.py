"""Read a Kedro project's inspection snapshot and raw config for the adapter."""

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
    """Temporarily mock missing project imports for kedro-viz lite mode."""
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


class _InspectionSession:
    """Read a project's snapshot and config, bootstrapping and building the loader once.

    Create one session per request. The project is bootstrapped and the Kedro config loader is built
    lazily on first use and then cached, so the catalog config and parameters reuse a single loader
    instead of rebuilding it.
    """

    def __init__(
        self,
        project_path: str | Path,
        env: str | None = None,
        runtime_params: dict[str, Any] | None = None,
    ) -> None:
        self.project_path = Path(project_path)
        self.env = env
        self.runtime_params = runtime_params
        self._config_loader: Any = None

    @property
    def config_loader(self) -> Any:
        """The project's Kedro config loader, bootstrapped and built once, then cached."""
        if self._config_loader is None:
            from kedro.framework.project import settings
            from kedro.framework.startup import bootstrap_project

            bootstrap_project(self.project_path)
            self._config_loader = settings.CONFIG_LOADER_CLASS(
                conf_source=str(self.project_path / settings.CONF_SOURCE),
                env=self.env,
                runtime_params=self.runtime_params or {},
                **settings.CONFIG_LOADER_ARGS,
            )
        return self._config_loader

    def snapshot(self) -> ProjectSnapshot:
        """Return the read-only inspection snapshot for the project."""
        from kedro.inspection import get_project_snapshot

        return get_project_snapshot(project_path=self.project_path, env=self.env)

    def catalog_config(self) -> dict[str, Any]:
        """Return the raw catalog config (no DataCatalog is built), or {} if there is none.

        Used to read Viz-only metadata such as layers.
        """
        from kedro.config import MissingConfigException

        try:
            return self.config_loader["catalog"]
        except (KeyError, MissingConfigException):
            return {}

    def parameters(self) -> dict[str, Any]:
        """Return the resolved parameter values, with ``--params`` overrides applied.

        The snapshot carries only parameter names, so values are read from the config loader. We
        pass ``runtime_params`` to that loader, so it already merges the ``--params`` overrides and
        resolves ``${runtime_params:...}`` for us.
        """
        from kedro.config import MissingConfigException

        try:
            return self.config_loader["parameters"]
        except (KeyError, MissingConfigException):
            return {}
