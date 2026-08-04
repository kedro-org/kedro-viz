"""Node-ID helpers for Kedro-Viz graph objects."""

from __future__ import annotations

import re
from collections.abc import Sequence

from kedro_viz.utils import _hash, _hash_input_output

_AUTO_NAME_RE = re.compile(r"^(?P<base>.+)__[0-9a-f]{8}$")


def _is_auto_node_name(local_name: str, func_name: str) -> bool:
    """Return whether Kedro generated this node's name, rather than the user supplying one.

    The caller removes any namespace prefix before passing the name. When ``name=`` is
    omitted, Kedro appends ``__`` and an eight-character hexadecimal hash to the function
    name. Partial functions use ``partial(<function>)`` as the base. The base is checked
    against ``func_name`` so an explicit name that merely looks generated is not mistaken
    for one.

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
    return base == func_name or (base.startswith("partial(") and base.endswith(")"))


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
    """Reconstruct and hash ``Node.__str__`` for the legacy Viz task ID.

    Args:
        node_name: ``NodeSnapshot.name`` (already namespace-prefixed).
        func_name: ``NodeSnapshot.func_name``.
        namespace: ``NodeSnapshot.namespace``.
        inputs: Node input names, in declaration order.
        outputs: Node output names, in declaration order.

    Returns:
        The task node's Viz graph ID.
    """
    local_name = node_name.removeprefix(f"{namespace}.") if namespace else node_name
    prefix = "" if _is_auto_node_name(local_name, func_name) else f"{local_name}: "
    input_names = f"[{';'.join(inputs)}]" if inputs else "None"
    output_names = f"[{';'.join(outputs)}]" if outputs else "None"
    return _hash(f"{prefix}{func_name}({input_names}) -> {output_names}")
