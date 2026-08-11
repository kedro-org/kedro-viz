"""Kedro modular pipeline set algebra on inspection snapshots.

Kedro defines namespace boundaries via ``Pipeline.inputs()`` and ``Pipeline.outputs()``.
The inspection API exposes flat ``NodeSnapshot`` lists instead of live ``Pipeline`` objects,
so this module reimplements that calculation.

See ``kedro.pipeline.pipeline`` for the source of truth.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro_viz.utils import _strip_transcoding

if TYPE_CHECKING:
    from kedro.inspection.models import NodeSnapshot

_BoundaryIO = tuple[set[str], set[str]]
_BoundaryIOByModularPipeline = dict[str, _BoundaryIO]


def _ancestor_namespaces(namespace: str) -> list[str]:
    """``"a.b.c"`` -> ``["a", "a.b", "a.b.c"]``."""
    parts = namespace.split(".")
    return [".".join(parts[: i + 1]) for i in range(len(parts))]


def _in_subtree(node: NodeSnapshot, mp_id: str) -> bool:
    """Whether a node lives in modular pipeline ``mp_id`` or any of its descendants."""
    namespace = node.namespace
    if namespace is None:
        return False
    return namespace == mp_id or namespace.startswith(f"{mp_id}.")


def _modular_pipeline_ids(nodes: list[NodeSnapshot]) -> set[str]:
    """Every modular pipeline the nodes belong to, including ancestors.

    Raises:
        ValueError: If a namespace collides with the synthetic root entry.
    """
    reserved_namespaces = sorted(
        {
            node.namespace
            for node in nodes
            if node.namespace
            and (
                node.namespace == ROOT_MODULAR_PIPELINE_ID
                or node.namespace.startswith(f"{ROOT_MODULAR_PIPELINE_ID}.")
            )
        }
    )
    if reserved_namespaces:
        namespace = reserved_namespaces[0]
        raise ValueError(
            f"Namespace {namespace!r} conflicts with Kedro-Viz's internal "
            "modular-pipeline root. Rename the namespace to render this project."
        )

    return {
        mp_id
        for node in nodes
        if node.namespace
        for mp_id in _ancestor_namespaces(node.namespace)
    }


def _remove_intermediates(
    datasets: set[str], all_inputs: set[str], all_outputs: set[str]
) -> set[str]:
    """Drop datasets both produced and consumed within the same node set.

    Mirrors ``Pipeline._remove_intermediates``: transcoding is stripped only to decide what
    counts as intermediate, and the surviving names are returned in their original
    (possibly transcoded) form so later set operations compare like for like.
    """
    intermediate = {_strip_transcoding(i) for i in all_inputs} & {
        _strip_transcoding(o) for o in all_outputs
    }
    return {d for d in datasets if _strip_transcoding(d) not in intermediate}


def _free_io(nodes: list[NodeSnapshot], mp_id: str) -> _BoundaryIO:
    """Boundary inputs and outputs of a namespace subtree, in original dataset names.

    Follows Kedro's modular pipeline set algebra::

        free_inputs  = sub.inputs()
        free_outputs = sub.outputs() | (rest.inputs() & sub.all_outputs())

    See ``Pipeline.inputs()``, ``Pipeline.outputs()`` and ``Pipeline.all_outputs()`` in
    ``kedro.pipeline.pipeline`` for the source of truth.
    """
    sub: list[NodeSnapshot] = []
    rest: list[NodeSnapshot] = []
    for node in nodes:
        (sub if _in_subtree(node, mp_id) else rest).append(node)

    sub_inputs = {i for node in sub for i in node.inputs}
    sub_outputs = {o for node in sub for o in node.outputs}
    rest_inputs = {i for node in rest for i in node.inputs}
    rest_outputs = {o for node in rest for o in node.outputs}

    free_inputs = _remove_intermediates(sub_inputs, sub_inputs, sub_outputs)
    free_outputs = _remove_intermediates(sub_outputs, sub_inputs, sub_outputs) | (
        _remove_intermediates(rest_inputs, rest_inputs, rest_outputs) & sub_outputs
    )
    return free_inputs, free_outputs


@dataclass(frozen=True)
class _NamespaceBoundaries:
    """Namespace IDs, dataset assignments and boundary I/O for one node list.

    Dataset assignments use transcoding-stripped names; boundary I/O keeps original names.
    """

    modular_pipeline_ids: set[str]
    datasets_by_modular_pipeline: dict[str, set[str]]
    boundary_io_by_modular_pipeline: _BoundaryIOByModularPipeline


def compute_namespace_boundaries(nodes: list[NodeSnapshot]) -> _NamespaceBoundaries:
    """Compute namespace IDs, dataset assignments and boundary I/O for one node list."""
    modular_pipeline_ids = _modular_pipeline_ids(nodes)
    datasets_by_modular_pipeline: dict[str, set[str]] = {}
    boundary_io_by_modular_pipeline: _BoundaryIOByModularPipeline = {}

    # Datasets assigned to each modular pipeline: I/O of its direct nodes, plus the boundary of
    # its whole subtree. The boundary also supplies the tree, so it is calculated only once.
    for mp_id in modular_pipeline_ids:
        direct = {
            _strip_transcoding(io)
            for node in nodes
            if node.namespace == mp_id
            for io in [*node.inputs, *node.outputs]
        }
        free_inputs, free_outputs = _free_io(nodes, mp_id)
        boundary_io_by_modular_pipeline[mp_id] = free_inputs, free_outputs
        boundary = {_strip_transcoding(d) for d in free_inputs | free_outputs}
        datasets_by_modular_pipeline[mp_id] = direct | boundary

    return _NamespaceBoundaries(
        modular_pipeline_ids=modular_pipeline_ids,
        datasets_by_modular_pipeline=datasets_by_modular_pipeline,
        boundary_io_by_modular_pipeline=boundary_io_by_modular_pipeline,
    )
