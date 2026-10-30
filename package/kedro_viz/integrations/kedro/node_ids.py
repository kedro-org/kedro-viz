"""Node-ID helpers for Kedro-Viz graph objects."""

from __future__ import annotations

import re
from collections.abc import Sequence
from typing import TYPE_CHECKING

from kedro_viz.utils import _hash, _hash_input_output

if TYPE_CHECKING:
    from kedro.inspection.models import NodeSnapshot
    from kedro.pipeline.node import Node as KedroNode

_AUTO_NAME_RE = re.compile(r"^(?P<base>.+)__[0-9a-f]{8}$")
# Kedro 1.7 and earlier name a callable object without ``__name__`` by its default
# repr, which embeds a memory address that differs every time ``register_pipelines()``
# runs. Later Kedro uses the class name instead (kedro-org/kedro#5797).
_OBJECT_REPR_RE = re.compile(r"<(?P<qualname>\S+) object at 0x[0-9a-fA-F]+>")


def _stable_func_name(text: str) -> str:
    """Replace any default object repr with its class name, as later Kedro versions do.

    The snapshot and the deferred live load each build their own node objects, so an
    address-bearing name would give the same task a different ID on each side.

    Examples:
        >>> _stable_func_name("<my_project.nodes.Scale object at 0x10f2c980>")
        'Scale'
        >>> _stable_func_name("clean_data")
        'clean_data'
    """
    return _OBJECT_REPR_RE.sub(lambda match: match["qualname"].rsplit(".", 1)[-1], text)


def _is_auto_node_name(local_name: str, func_name: str) -> bool:
    """Return whether a node name matches Kedro's generated-name format.

    The caller removes any namespace prefix before passing the name. When ``name=`` is
    omitted, Kedro appends ``__`` and an eight-character hexadecimal hash to the function
    name. Partial functions use ``partial(<function>)`` as the base. For regular functions,
    the base is checked against ``func_name`` to reject unrelated explicit names that look
    generated.

    Examples:
        >>> _is_auto_node_name("clean_data__a1b2c3d4", "clean_data")
        True
        >>> _is_auto_node_name("partial(clean_data)__a1b2c3d4", "<partial>")
        True
        >>> _is_auto_node_name("report__deadbeef", "build_report")
        False
    """
    match = _AUTO_NAME_RE.fullmatch(local_name)
    if match is None:
        return False
    base = match["base"]
    if base == func_name:
        return True

    # Kedro generates partial names from the wrapped function, while func_name can
    # be "<partial>"; explicit node names cannot contain parentheses.
    return base.startswith("partial(") and base.endswith(")")


def _create_dataset_node_id(dataset_name: str) -> str:
    """Return the Viz graph ID for a data or parameter node.

    Transcoded names (``name@suffix``) hash on the base name.
    """
    return _hash_input_output(dataset_name)


def _create_task_node_id(
    node_name: str,
    func_name: str,
    namespace: str | None,
    inputs: Sequence[str],
    outputs: Sequence[str],
) -> str:
    """Reconstruct and hash ``Node.__str__`` to match the live backend's Viz task ID.

    Args:
        node_name: ``NodeSnapshot.name`` (already namespace-prefixed).
        func_name: ``NodeSnapshot.func_name``.
        namespace: ``NodeSnapshot.namespace``.
        inputs: Node input names, in declaration order.
        outputs: Node output names, in declaration order.

    Returns:
        The task node's Viz graph ID.

    Note:
        ``NodeSnapshot`` cannot distinguish an explicitly supplied
        ``<func_name>__<8 hexadecimal characters>`` name from a generated one, so this
        rare case cannot be reconstructed exactly.
    """
    func_name = _stable_func_name(func_name)
    local_name = node_name.removeprefix(f"{namespace}.") if namespace else node_name
    prefix = "" if _is_auto_node_name(local_name, func_name) else f"{local_name}: "
    input_names = f"[{';'.join(inputs)}]" if inputs else "None"
    output_names = f"[{';'.join(outputs)}]" if outputs else "None"
    return _hash(f"{prefix}{func_name}({input_names}) -> {output_names}")


def _create_task_node_id_from_node_snapshot(node: NodeSnapshot) -> str:
    """Return the Viz graph ID for a snapshot task node."""
    return _create_task_node_id(
        node_name=node.name,
        func_name=node.func_name,
        namespace=node.namespace,
        inputs=node.inputs,
        outputs=node.outputs,
    )


def _create_task_node_id_from_kedro_node(node: KedroNode) -> str:
    """Return the Viz graph ID for a live Kedro node, matching the snapshot's ID."""
    # Normalise only the function name, as the snapshot side does: a dataset name may
    # look like an object repr. Node names cannot contain "<", so the first match of an
    # address-bearing function name is the function segment of ``str(node)``.
    func_name = node._func_name  # noqa: SLF001 - the source of NodeSnapshot.func_name
    return _hash(str(node).replace(func_name, _stable_func_name(func_name), 1))
