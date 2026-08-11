"""Map datasets to their modular pipelines across the project."""

from __future__ import annotations

from collections.abc import Iterable
from typing import TYPE_CHECKING

from kedro_viz.utils import _strip_transcoding, is_dataset_param

from .boundaries import compute_namespace_boundaries

if TYPE_CHECKING:
    from kedro.inspection.models import NodeSnapshot, PipelineSnapshot


class ModularPipelineIndex:
    """Look up which modular pipelines each dataset belongs to."""

    def __init__(
        self,
        *,
        modular_pipeline_ids: set[str],
        datasets_by_modular_pipeline: dict[str, set[str]],
    ) -> None:
        self._modular_pipeline_ids = modular_pipeline_ids
        self._datasets_by_modular_pipeline = datasets_by_modular_pipeline

    @classmethod
    def from_nodes(cls, nodes: list[NodeSnapshot]) -> ModularPipelineIndex:
        """Build an index for one pipeline's nodes."""
        boundaries = compute_namespace_boundaries(nodes)

        return cls(
            modular_pipeline_ids=boundaries.modular_pipeline_ids,
            datasets_by_modular_pipeline=boundaries.datasets_by_modular_pipeline,
        )

    @classmethod
    def from_registered_pipelines(
        cls, pipelines: Iterable[PipelineSnapshot]
    ) -> ModularPipelineIndex:
        """Combine assignments calculated independently for each registered pipeline."""
        modular_pipeline_ids: set[str] = set()
        datasets_by_modular_pipeline: dict[str, set[str]] = {}
        for pipeline in pipelines:
            boundaries = compute_namespace_boundaries(pipeline.nodes)
            modular_pipeline_ids.update(boundaries.modular_pipeline_ids)
            for mp_id, datasets in boundaries.datasets_by_modular_pipeline.items():
                datasets_by_modular_pipeline.setdefault(mp_id, set()).update(datasets)
        return cls(
            modular_pipeline_ids=modular_pipeline_ids,
            datasets_by_modular_pipeline=datasets_by_modular_pipeline,
        )

    def modular_pipelines_for_dataset(self, name: str) -> list[str] | None:
        """Return the sorted modular pipeline IDs this dataset belongs to, or ``None``.

        Parameters are not assigned to any modular pipeline. Transcoded names belong to the
        same modular pipelines as their base names.
        """
        if is_dataset_param(name):
            return None
        base_name = _strip_transcoding(name)
        modular_pipeline_ids = sorted(
            mp_id
            for mp_id in self._modular_pipeline_ids
            if base_name in self._datasets_by_modular_pipeline[mp_id]
        )
        return modular_pipeline_ids or None
