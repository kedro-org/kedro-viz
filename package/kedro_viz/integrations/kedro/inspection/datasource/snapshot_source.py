"""Read a Kedro project's inspection snapshot and raw config for the adapter."""

from __future__ import annotations

import dataclasses
import logging
import os
from collections.abc import Generator, Iterable, Mapping
from contextlib import contextmanager, nullcontext
from functools import cached_property
from pathlib import Path
from typing import TYPE_CHECKING, Any

from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field, field_validator

from kedro_viz.integrations.kedro.inspection.errors import PipelineNotFoundError
from kedro_viz.utils import _strip_transcoding, stub_modules

if TYPE_CHECKING:
    from kedro.framework.startup import ProjectMetadata
    from kedro.inspection.models import PipelineSnapshot, ProjectSnapshot

logger = logging.getLogger(__name__)


class DatasetEntry(BaseModel):
    """Dataset references indexed under their base name, without an ``@`` suffix.

    Keep the first reference for catalog lookup and record whether any reference is
    transcoded for graph rendering.
    """

    name: str
    is_transcoded: bool = False


def build_dataset_index(
    pipelines: Iterable[PipelineSnapshot],
) -> dict[str, DatasetEntry]:
    """Index references in encounter order over exactly the supplied pipelines.

    Graphs pass their selected pipeline so indexing does not broaden the rendered view.
    """
    datasets: dict[str, DatasetEntry] = {}

    def index_reference(reference: str) -> None:
        base_name = _strip_transcoding(reference)
        entry = datasets.get(base_name)
        if entry is None:
            entry = datasets[base_name] = DatasetEntry(name=reference)
        if reference != base_name:
            entry.is_transcoded = True

    for pipeline in pipelines:
        for node in pipeline.nodes:
            for reference in node.inputs:
                index_reference(reference)
            for reference in node.outputs:
                index_reference(reference)
    return datasets


def build_parameters_from_inputs(
    inputs: list[str], parameters: dict[str, Any]
) -> dict[str, Any]:
    """Resolve input references with the existing inspection parameter semantics.

    Walk inputs in order: ``parameters`` replaces the result with the root mapping,
    while ``params:name`` adds one nested lookup.
    """
    result: dict[str, Any] = {}
    for ref in inputs:
        if ref == "parameters":
            result = {
                key: _to_json_compatible(value) for key, value in parameters.items()
            }
        elif ref.startswith("params:"):
            name = ref[len("params:") :]
            result[name] = _to_json_compatible(_resolve_parameters(parameters, name))
    return result


def _to_json_compatible(value: Any) -> Any:
    """Encode a parameter value the way the live ``ParametersNode`` does.

    Config resolvers can return objects JSON cannot represent, such as a numpy or polars
    dtype. Fall back to their string form instead of failing the whole graph response.
    """
    try:
        return jsonable_encoder(value)
    except (TypeError, ValueError, RecursionError):
        return str(value)


def _resolve_parameters(parameters: dict[str, Any], dotted: str) -> Any:
    """Look up a dotted path, returning ``None`` when it is absent.

    The path steps through dictionaries and through the fields of typed parameters,
    as Kedro does when it registers nested ``params:`` datasets.
    """
    from kedro.validation.utils import get_typed_fields

    node: Any = parameters
    for key in dotted.split("."):
        fields = node if isinstance(node, dict) else get_typed_fields(node)
        if fields is None or key not in fields:
            return None
        node = fields[key]
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
) -> Generator[None]:
    """Temporarily mock missing project imports for kedro-viz lite mode."""
    from kedro_viz.integrations.kedro.lite.lite_parser import LiteParser
    from kedro_viz.models.metadata import Metadata

    lite_parser = LiteParser(package_name)
    unresolved = lite_parser.parse(Path(project_path)) or {}
    modules_to_mock: set[str] = set()
    for module_set in unresolved.values():
        modules_to_mock |= module_set

    if not modules_to_mock:
        yield
        return

    # Same banner the live --lite loader sets, so the UI flags limited functionality.
    Metadata.set_has_missing_dependencies(True)
    logger.warning(
        "Kedro-Viz --lite: building the snapshot with %d project dependency module(s) "
        "mocked. Install them for full functionality:\n%s",
        len(modules_to_mock),
        sorted(modules_to_mock),
    )

    with stub_modules(lite_parser.create_mock_modules(modules_to_mock)):
        yield


class _InspectionSession:
    """Read a project's snapshot and config with one bootstrap and one cached config loader.

    The catalog config and parameters share the loader built lazily here. Kedro's snapshot API
    loads its own config, but reuses this session's bootstrap, because each bootstrap resets
    Kedro's pipeline registry and parameter typing would then register the pipelines again.
    """

    def __init__(
        self,
        project_path: str | Path,
        env: str | None = None,
        runtime_params: dict[str, Any] | None = None,
    ) -> None:
        self.project_path = Path(project_path)
        # Resolve the env as `KedroSession.create` does, so the snapshot and the deferred
        # live load read the same configuration when only `KEDRO_ENV` is set, as with
        # `%run_viz` or `kedro jupyter --env`.
        self.env = env or os.getenv("KEDRO_ENV")
        self.runtime_params = runtime_params
        self._config_loader: Any = None

    @cached_property
    def _metadata(self) -> ProjectMetadata:
        """Bootstrap the project once for every read in this session."""
        from kedro.framework.startup import bootstrap_project

        return bootstrap_project(self.project_path)

    @property
    def config_loader(self) -> Any:
        """The project's Kedro config loader, bootstrapped and built once, then cached."""
        if self._config_loader is None:
            from kedro.framework.project import settings

            _ = self._metadata  # The bootstrap fills `settings` for this project.
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

        return get_project_snapshot(
            metadata=self._metadata,
            env=self.env,
            runtime_params=self.runtime_params,
        )

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
        """Return the resolved parameter values, typed as ``KedroContext.params`` types them.

        The snapshot carries only parameter names, so values are read from the config loader. We
        pass ``runtime_params`` to that loader, so it already merges the ``--params`` overrides and
        resolves ``${runtime_params:...}`` for us. Kedro then builds the Pydantic model or
        dataclass that a node annotates a parameter with, so a ``SecretStr`` field stays masked
        in the graph, as it is in the node details.

        Raises:
            ParameterValidationError: If a value does not fit its annotated type, as with
                ``kedro run``.
        """
        from kedro.config import MissingConfigException
        from kedro.framework.project import pipelines
        from kedro.validation.parameter_validator import ParameterValidator

        try:
            raw_params = self.config_loader["parameters"]
        except (KeyError, MissingConfigException):
            return {}
        return ParameterValidator(dict(pipelines)).validate_raw_params(raw_params)


def load_inspection_inputs(
    project_path: str | Path,
    *,
    env: str | None = None,
    runtime_params: dict[str, Any] | None = None,
    package_name: str | None = None,
    is_lite: bool = False,
) -> InspectionInputs:
    """Read the snapshot and resolved config for one context build.

    Lite-mode import stubs remain active until all three inputs have been read. The snapshot
    and Viz config reads share one project bootstrap through ``_InspectionSession``.
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
