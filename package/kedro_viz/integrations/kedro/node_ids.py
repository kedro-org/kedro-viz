"""Node-ID helpers for Kedro-Viz graph objects."""

from __future__ import annotations

import json
import re
from collections.abc import Sequence
from typing import Any

from kedro_viz.utils import _hash, _hash_input_output

# Capability flag: the branch Kedro (feat/add-fun-src-code) carries ``NodeSnapshot.func_name``,
# which lets the adapter reconstruct the live-backend task-node ID byte-for-byte. Released Kedro
# lacks the field, so the adapter keeps its self-contained new-scheme IDs instead.
try:
    from kedro.inspection.models import NodeSnapshot as _NodeSnapshot

    _SNAPSHOT_HAS_FUNC_NAME = "func_name" in getattr(
        _NodeSnapshot, "__dataclass_fields__", {}
    )
except Exception:  # noqa: BLE001
    _SNAPSHOT_HAS_FUNC_NAME = False

# Auto-named nodes look like ``<func>__<8 hex>``; those carry no name prefix in ``Node.__str__``.
_AUTO_NAME_RE = re.compile(r"^.+__[0-9a-f]{8}$")


def _create_dataset_node_id(dataset_name: str) -> str:
    """Return the Viz graph ID for a data or parameter node.

    Transcoded names (``name@suffix``) hash on the base name.
    """
    return _hash_input_output(dataset_name)


def _reconstruct_node_str(
    node_name: str,
    namespace: str | None,
    func_name: str,
    inputs: Sequence[str],
    outputs: Sequence[str],
) -> str:
    """Rebuild the live ``Node.__str__`` from snapshot fields.

    Mirrors Kedro's ``prefix + f"{func_name}({in_str}) -> {out_str}"`` where each of ``in_str`` /
    ``out_str`` is ``"[" + ";".join(items) + "]"`` (or ``"None"`` when empty), and ``prefix`` is the
    node's local name plus ``": "`` for explicitly-named nodes (empty for auto-named nodes).
    Hashing this string yields the same ID the live backend computes via ``_hash(str(node))``.
    """

    def _io(items: Sequence[str]) -> str:
        items = list(items)
        return f"[{';'.join(items)}]" if items else "None"

    if _AUTO_NAME_RE.match(node_name):
        prefix = ""
    elif namespace and node_name.startswith(f"{namespace}."):
        prefix = node_name[len(namespace) + 1 :] + ": "
    else:
        prefix = node_name + ": "
    return prefix + f"{func_name}({_io(inputs)}) -> {_io(outputs)}"


def _create_task_node_id(
    node_name: str,
    inputs: Sequence[str],
    outputs: Sequence[str],
    *,
    func_name: str | None = None,
    namespace: str | None = None,
) -> str:
    """Return the Viz graph ID for a task node.

    When the snapshot carries ``func_name`` (branch Kedro) the live-backend ID is reconstructed
    from the node's string form, so snapshot IDs equal live IDs. Otherwise it falls back to the
    self-contained new scheme: a hash of the identity-defining fields (the namespaced node name
    plus its inputs and outputs), JSON-serialized so the encoding is unambiguous (e.g. a single
    input ``"a,b"`` never collides with two inputs ``"a"``, ``"b"``).

    Args:
        node_name: ``NodeSnapshot.name`` (already namespace-prefixed).
        inputs: Node input names, in declaration order.
        outputs: Node output names, in declaration order.
        func_name: The node's function name (branch Kedro only); enables live-ID reconstruction.
        namespace: The node's namespace, used to strip the local-name prefix when reconstructing.

    Returns:
        The task node's Viz graph ID.
    """
    if _SNAPSHOT_HAS_FUNC_NAME and func_name is not None:
        return _hash(
            _reconstruct_node_str(node_name, namespace, func_name, inputs, outputs)
        )
    signature = json.dumps([node_name, list(inputs), list(outputs)])
    return _hash(signature)


def _task_node_id_from_snapshot(node: Any) -> str:
    """Task id for a NodeSnapshot (reconstructs the old id when func_name is present)."""
    func_name = node.func_name if _SNAPSHOT_HAS_FUNC_NAME else None
    return _create_task_node_id(
        node.name,
        node.inputs,
        node.outputs,
        func_name=func_name,
        namespace=node.namespace,
    )


def _task_node_id_from_kedro_node(node: Any) -> str:
    """Task id for a live Kedro Node (its true old id is the hash of its string form)."""
    if _SNAPSHOT_HAS_FUNC_NAME:
        return _hash(str(node))
    return _create_task_node_id(node.name, list(node.inputs), list(node.outputs))
