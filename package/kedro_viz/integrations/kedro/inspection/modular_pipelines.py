"""Build modular pipeline groups, their tree and boundary edges from snapshot namespaces.

Concepts:

* Namespace: a dotted node path whose prefixes form nested modular-pipeline groups.
* Boundary I/O: datasets that enter or leave a namespace subtree.
* Tree: the group hierarchy and its task, dataset and nested-group children.
* Boundary edges: links between group nodes and their input and output datasets.

Boundary calculations follow Kedro's ``Pipeline`` set algebra on flat ``NodeSnapshot`` data.
"""

from __future__ import annotations

from collections import defaultdict
from collections.abc import Iterable
from dataclasses import dataclass, field
from typing import TYPE_CHECKING

from kedro_viz.api.rest.responses.pipelines import GraphEdgeAPIResponse
from kedro_viz.constants import ROOT_MODULAR_PIPELINE_ID
from kedro_viz.integrations.kedro.node_ids import (
    _create_dataset_node_id,
    _create_task_node_id_from_node_snapshot,
)
from kedro_viz.models.flowchart.model_utils import GraphNodeType
from kedro_viz.utils import _strip_transcoding, is_dataset_param

if TYPE_CHECKING:
    from kedro.inspection.models import NodeSnapshot, PipelineSnapshot

_BoundaryIO = tuple[set[str], set[str]]
_BoundaryIOByModularPipeline = dict[str, _BoundaryIO]


def _ancestor_namespaces(namespace: str) -> list[str]:
    """``"a.b.c"`` -> ``["a", "a.b", "a.b.c"]``."""
    parts = namespace.split(".")
    return [".".join(parts[: i + 1]) for i in range(len(parts))]


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


def _free_io(nodes: list[NodeSnapshot], mp_id: str) -> tuple[set[str], set[str]]:
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
    """Namespace IDs, dataset ownership and boundary I/O for one node list.

    Dataset ownership uses transcoding-stripped names; boundary I/O keeps original names.
    """

    modular_pipeline_ids: set[str]
    datasets_by_modular_pipeline: dict[str, set[str]]
    boundary_io_by_modular_pipeline: _BoundaryIOByModularPipeline


def _compute_namespace_boundaries(nodes: list[NodeSnapshot]) -> _NamespaceBoundaries:
    """Compute namespace IDs, dataset ownership and boundary I/O for one node list."""
    modular_pipeline_ids = _modular_pipeline_ids(nodes)
    datasets_by_modular_pipeline: dict[str, set[str]] = {}
    boundary_io_by_modular_pipeline: _BoundaryIOByModularPipeline = {}

    # Datasets owned by each modular pipeline: I/O of its direct nodes, plus the boundary of
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


class _ModularPipelineIndex:
    """Look up which modular pipelines own each dataset."""

    def __init__(
        self,
        *,
        modular_pipeline_ids: set[str],
        datasets_by_modular_pipeline: dict[str, set[str]],
    ) -> None:
        self._ids = modular_pipeline_ids
        self._datasets_by_modular_pipeline = datasets_by_modular_pipeline

    @classmethod
    def from_nodes(cls, nodes: list[NodeSnapshot]) -> _ModularPipelineIndex:
        """Build an index for one pipeline's nodes."""
        boundaries = _compute_namespace_boundaries(nodes)

        return cls(
            modular_pipeline_ids=boundaries.modular_pipeline_ids,
            datasets_by_modular_pipeline=boundaries.datasets_by_modular_pipeline,
        )

    @classmethod
    def from_registered_pipelines(
        cls, pipelines: Iterable[PipelineSnapshot]
    ) -> _ModularPipelineIndex:
        """Union ownership calculated independently for each registered pipeline."""
        modular_pipeline_ids: set[str] = set()
        datasets_by_modular_pipeline: dict[str, set[str]] = {}
        for pipeline in pipelines:
            boundaries = _compute_namespace_boundaries(pipeline.nodes)
            modular_pipeline_ids.update(boundaries.modular_pipeline_ids)
            for mp_id, datasets in boundaries.datasets_by_modular_pipeline.items():
                datasets_by_modular_pipeline.setdefault(mp_id, set()).update(datasets)
        return cls(
            modular_pipeline_ids=modular_pipeline_ids,
            datasets_by_modular_pipeline=datasets_by_modular_pipeline,
        )

    def get_modular_pipelines_for_dataset(self, name: str) -> list[str] | None:
        """A dataset belongs to every modular pipeline that owns it."""
        if is_dataset_param(name):
            return None
        stripped = _strip_transcoding(name)
        owners = sorted(
            mp_id
            for mp_id in self._ids
            if stripped in self._datasets_by_modular_pipeline[mp_id]
        )
        return owners or None


@dataclass
class _ModularPipelineTreeEntry:
    """One node in the modular-pipeline tree.

    ``name`` and the modular-pipeline IDs are namespace strings; dataset and task IDs in
    ``inputs``, ``outputs`` and ``children`` are hashed graph IDs.
    """

    name: str
    inputs: set[str] = field(default_factory=set)
    outputs: set[str] = field(default_factory=set)
    children: set[tuple[str, str]] = field(default_factory=set)  # (node_id, node_type)


class _ModularPipelineTreeBuilder:
    """Build the modular-pipeline tree for the nodes of a single rendered pipeline."""

    def __init__(self, nodes: list[NodeSnapshot]) -> None:
        self._nodes = nodes
        # Resolved against this pipeline's nodes only: a node is a root child when it has no
        # modular owner *in this pipeline*, which can differ from its owners across the project.
        boundaries = _compute_namespace_boundaries(nodes)
        self._boundary_io_by_modular_pipeline = (
            boundaries.boundary_io_by_modular_pipeline
        )
        self._index = _ModularPipelineIndex(
            modular_pipeline_ids=boundaries.modular_pipeline_ids,
            datasets_by_modular_pipeline=boundaries.datasets_by_modular_pipeline,
        )
        self.ids = sorted(boundaries.modular_pipeline_ids)

    def build(self) -> dict[str, _ModularPipelineTreeEntry]:
        """Return the tree keyed by modular pipeline ID, including ``__root__``.

        Parameter references are tracked separately so they remain parameter children under
        ``__root__`` instead of being added as data children inside modular pipelines.
        """
        root = _ModularPipelineTreeEntry(ROOT_MODULAR_PIPELINE_ID)
        tree = {ROOT_MODULAR_PIPELINE_ID: root}
        params: set[str] = set()

        for mp_id in self.ids:
            self._populate_entry(tree, mp_id, params)

        self._add_root_children(root)
        return tree

    def _populate_entry(
        self,
        tree: dict[str, _ModularPipelineTreeEntry],
        mp_id: str,
        params: set[str],
    ) -> None:
        """Populate one entry, record its boundary parameters and link it to its parent."""
        entry = tree.setdefault(mp_id, _ModularPipelineTreeEntry(mp_id))
        free_inputs, free_outputs = self._boundary_io_by_modular_pipeline[mp_id]
        entry.inputs = {_create_dataset_node_id(d) for d in free_inputs}
        entry.outputs = {_create_dataset_node_id(d) for d in free_outputs}
        params.update(
            _create_dataset_node_id(d) for d in free_inputs if is_dataset_param(d)
        )
        boundary = entry.inputs | entry.outputs

        self._add_direct_children(entry, mp_id, boundary, params)
        self._link_to_parent(tree, mp_id, boundary, params)

    def get_tags_by_modular_pipeline(self) -> dict[str, list[str]]:
        """Tags for each modular-pipeline node = the union of its whole subtree's tags."""
        return {
            mp_id: sorted(
                {
                    tag
                    for node in self._nodes
                    if _in_subtree(node, mp_id)
                    for tag in node.tags
                }
            )
            for mp_id in self.ids
        }

    def _add_direct_children(
        self,
        entry: _ModularPipelineTreeEntry,
        mp_id: str,
        boundary: set[str],
        params: set[str],
    ) -> None:
        """Add direct task and internal dataset children to a modular pipeline."""
        for node in self._nodes:
            if node.namespace != mp_id:
                continue
            entry.children.add(
                (
                    _create_task_node_id_from_node_snapshot(node),
                    GraphNodeType.TASK.value,
                )
            )
            io_ids = {
                _create_dataset_node_id(io) for io in [*node.inputs, *node.outputs]
            }
            for io_id in io_ids - boundary - params:
                entry.children.add((io_id, GraphNodeType.DATA.value))

    def _link_to_parent(
        self,
        tree: dict[str, _ModularPipelineTreeEntry],
        mp_id: str,
        boundary: set[str],
        params: set[str],
    ) -> None:
        """Link a modular pipeline and its eligible boundary datasets to its parent."""
        parent_id = (
            mp_id.rsplit(".", 1)[0] if "." in mp_id else ROOT_MODULAR_PIPELINE_ID
        )
        parent = tree.setdefault(parent_id, _ModularPipelineTreeEntry(parent_id))
        parent.children.add((mp_id, GraphNodeType.MODULAR_PIPELINE.value))
        for dataset_id in boundary:
            if (
                dataset_id not in parent.inputs
                and dataset_id not in parent.outputs
                and dataset_id not in params
            ):
                parent.children.add((dataset_id, GraphNodeType.DATA.value))

    def _add_root_children(self, root: _ModularPipelineTreeEntry) -> None:
        """Add unowned datasets and unnamespaced tasks to the synthetic root."""
        for dataset in {
            _strip_transcoding(io)
            for node in self._nodes
            for io in [*node.inputs, *node.outputs]
        }:
            if self._index.get_modular_pipelines_for_dataset(dataset) is None:
                node_type = (
                    GraphNodeType.PARAMETERS.value
                    if is_dataset_param(dataset)
                    else GraphNodeType.DATA.value
                )
                root.children.add((_create_dataset_node_id(dataset), node_type))
        for node in self._nodes:
            if node.namespace is None:
                root.children.add(
                    (
                        _create_task_node_id_from_node_snapshot(node),
                        GraphNodeType.TASK.value,
                    )
                )


def _in_subtree(node: NodeSnapshot, mp_id: str) -> bool:
    """Whether a node lives in modular pipeline ``mp_id`` or any of its descendants."""
    namespace = node.namespace
    if namespace is None:
        return False
    return namespace == mp_id or namespace.startswith(f"{mp_id}.")


def _add_modular_pipeline_boundary_edges(
    edges: dict[tuple[str, str], GraphEdgeAPIResponse],
    tree: dict[str, _ModularPipelineTreeEntry],
) -> None:
    """Connect each modular pipeline to its boundary datasets (input -> mp, mp -> output)."""
    for mp_id, entry in tree.items():
        if mp_id == ROOT_MODULAR_PIPELINE_ID:
            continue
        for input_id in sorted(entry.inputs):
            edges.setdefault(
                (input_id, mp_id),
                GraphEdgeAPIResponse(source=input_id, target=mp_id),
            )
        for output_id in sorted(entry.outputs):
            edges.setdefault(
                (mp_id, output_id),
                GraphEdgeAPIResponse(source=mp_id, target=output_id),
            )


def _remove_cyclic_modular_pipeline_boundary_edges(
    edges: dict[tuple[str, str], GraphEdgeAPIResponse],
    tree: dict[str, _ModularPipelineTreeEntry],
) -> None:
    """Drop an ``input -> mp`` edge when its input is reachable downstream of ``mp``.

    For example, ``ns.inner`` consumes ``a`` and produces ``b``, while an outer task consumes
    ``b`` and produces ``a``. The path ``ns -> b -> outer -> a`` means retaining ``a -> ns``
    would create a cycle.
    """
    adjacency: dict[str, set[str]] = defaultdict(set)
    for source, target in edges:
        adjacency[source].add(target)
    for mp_id, entry in tree.items():
        if mp_id == ROOT_MODULAR_PIPELINE_ID:
            continue
        reachable = _reachable_from(mp_id, adjacency)
        for input_id in sorted(entry.inputs & reachable):
            edges.pop((input_id, mp_id), None)
            adjacency[input_id].discard(mp_id)


def _reachable_from(start: str, adjacency: dict[str, set[str]]) -> set[str]:
    """Return all nodes reachable from ``start`` (excluding ``start`` unless it is in a cycle)."""
    seen: set[str] = set()
    stack = list(adjacency.get(start, ()))
    while stack:
        node = stack.pop()
        if node in seen:
            continue
        seen.add(node)
        stack.extend(adjacency.get(node, ()))
    return seen
