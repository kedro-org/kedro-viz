"""Read a Kedro project's inspection snapshot and raw config for the adapter."""

from __future__ import annotations

import dataclasses
import logging
from collections.abc import Iterable, Iterator, Mapping
from contextlib import contextmanager, nullcontext
from pathlib import Path
from typing import TYPE_CHECKING, Any

from pydantic import BaseModel, Field, field_validator

from kedro_viz.integrations.kedro.inspection.errors import PipelineNotFoundError
from kedro_viz.utils import _strip_transcoding

if TYPE_CHECKING:
    from kedro.inspection.models import PipelineSnapshot, ProjectSnapshot

logger = logging.getLogger(__name__)


class DatasetEntry(BaseModel):
    """Dataset references indexed under their base name, without an ``@`` suffix.

    Name and free-input status use the first encounter; producer assignment uses the last.
    Only transcoded-first entries collect distinct ordered ``inputs`` and ``output``,
    including later plain references. ``is_transcoded`` records any transcoded reference
    for graph rendering, independently of that first-encounter metadata rule.
    """

    name: str
    is_free_input: bool = False
    is_transcoded: bool = False
    inputs: list[str] = Field(default_factory=list)
    output: str | None = None


def build_dataset_index(
    pipelines: Iterable[PipelineSnapshot],
) -> dict[str, DatasetEntry]:
    """Index references in encounter order over exactly the supplied pipelines.

    Graphs pass their selected pipeline; metadata passes the loaded snapshot's pipelines.
    Sharing the traversal must not broaden either consumer's scope.
    """
    datasets: dict[str, DatasetEntry] = {}

    def index_reference(reference: str, *, is_input: bool, is_free_input: bool) -> None:
        base_name = _strip_transcoding(reference)
        entry = datasets.get(base_name)
        if entry is None:
            entry = datasets[base_name] = DatasetEntry(
                name=reference, is_free_input=is_free_input
            )
        if reference != base_name:
            entry.is_transcoded = True
        if entry.name == base_name:
            return
        if is_input:
            if reference not in entry.inputs:
                entry.inputs.append(reference)
        else:
            entry.output = reference

    for pipeline in pipelines:
        for node in pipeline.nodes:
            for reference in node.inputs:
                index_reference(
                    reference,
                    is_input=True,
                    is_free_input=reference in pipeline.inputs,
                )
            for reference in node.outputs:
                index_reference(reference, is_input=False, is_free_input=False)
    return datasets


def build_parameters_from_inputs(
    inputs: list[str], parameters: dict[str, Any]
) -> dict[str, Any]:
    """Resolve input references with the existing inspection parameter semantics.

    Walk inputs in order: ``parameters`` replaces the result with the root mapping,
    while ``params:name`` adds one nested lookup. No validation or typed-field expansion.
    """
    result: dict[str, Any] = {}
    for ref in inputs:
        if ref == "parameters":
            result = dict(parameters)
        elif ref.startswith("params:"):
            name = ref[len("params:") :]
            result[name] = _resolve_parameters(parameters, name)
    return result


def _resolve_parameters(parameters: dict[str, Any], dotted: str) -> Any:
    """Look up a dotted dictionary path, returning ``None`` when it is absent."""
    node: Any = parameters
    for key in dotted.split("."):
        if isinstance(node, dict) and key in node:
            node = node[key]
        else:
            return None
    return node


class InspectionInputs(BaseModel, frozen=True):
    """Snapshot and resolved config shared by a project's inspection services."""

    # Kedro has already built the snapshot. Keep it opaque to Pydantic so importing
    # this model does not load Kedro inspection modules before lite-mode stubs.
    if TYPE_CHECKING:
        snapshot: ProjectSnapshot
    else:
        snapshot: Any
    catalog_config: Mapping[str, Any] = Field(default_factory=dict)
    parameters: Mapping[str, Any] = Field(default_factory=dict)

    @field_validator("catalog_config", "parameters", mode="before")
    @classmethod
    def _copy_mapping(cls, value: Mapping[str, Any]) -> dict[str, Any]:
        """Copy caller-owned mappings before storing the prepared inputs."""
        return dict(value)


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
    """Read a project's snapshot and config with one cached config loader.

    The catalog config and parameters share the loader built lazily here. Kedro's snapshot API
    performs its own internal project bootstrap and config loading.
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


def load_inspection_inputs(
    project_path: str | Path,
    *,
    env: str | None = None,
    runtime_params: dict[str, Any] | None = None,
    package_name: str | None = None,
    is_lite: bool = False,
) -> InspectionInputs:
    """Read the snapshot and resolved config for one context build.

    Lite-mode import stubs remain active until all three inputs have been read. A single
    ``_InspectionSession`` coordinates the reads; Kedro's snapshot API may perform its own
    internal bootstrap independently of the cached config loader used by the other two reads.
    """
    import_context = (
        lite_import_stubs(project_path, package_name) if is_lite else nullcontext()
    )
    with import_context:
        session = _InspectionSession(
            project_path,
            env=env,
            runtime_params=runtime_params,
        )
        return InspectionInputs(
            snapshot=session.snapshot(),
            catalog_config=session.catalog_config(),
            parameters=session.parameters(),
        )


def filter_inspection_inputs(
    inputs: InspectionInputs,
    pipeline_name: str,
) -> InspectionInputs:
    """Return inspection inputs whose snapshot contains only ``pipeline_name``.

    Raises:
        PipelineNotFoundError: If ``pipeline_name`` is not registered.
    """
    matching = [
        pipeline
        for pipeline in inputs.snapshot.pipelines
        if pipeline.name == pipeline_name
    ]
    if not matching:
        available = sorted(pipeline.name for pipeline in inputs.snapshot.pipelines)
        raise PipelineNotFoundError(
            f"Pipeline {pipeline_name!r} not found in snapshot; available: {available}"
        )

    return InspectionInputs(
        snapshot=dataclasses.replace(inputs.snapshot, pipelines=matching),
        catalog_config=inputs.catalog_config,
        parameters=inputs.parameters,
    )
