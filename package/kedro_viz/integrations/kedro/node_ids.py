"""Node-ID helpers for Kedro-Viz graph objects."""

from __future__ import annotations

import json
from collections.abc import Sequence

from kedro_viz.utils import _hash, _hash_input_output


def _create_dataset_node_id(dataset_name: str) -> str:
    """Return the Viz graph ID for a data or parameter node.

    Transcoded names (``name@suffix``) hash on the base name.
    """
    return _hash_input_output(dataset_name)


def _create_task_node_id(
    node_name: str, inputs: Sequence[str], outputs: Sequence[str]
) -> str:
    """Return the Viz graph ID for a task node.

    Hashes only identity-defining fields: the namespaced node name plus its inputs and outputs.
    The fields are JSON-serialized so the encoding is unambiguous (e.g. a single input
    ``"a,b"`` never collides with two inputs ``"a"``, ``"b"``).

    Args:
        node_name: ``NodeSnapshot.name`` (already namespace-prefixed).
        inputs: Node input names, in declaration order.
        outputs: Node output names, in declaration order.

    Returns:
        The task node's Viz graph ID.
    """
    signature = json.dumps([node_name, list(inputs), list(outputs)])
    return _hash(signature)
