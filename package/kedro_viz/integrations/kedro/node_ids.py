"""Shared Kedro-Viz node-ID generation for the adapter and the run-status hook.

Single source of truth for the Viz node-ID scheme. Lives outside ``inspection/`` so non-inspection
callers (notably :func:`kedro_viz.integrations.kedro.hooks_utils.hash_node`) can import it without
depending on the adapter.

IDs hash only identity-defining fields — the namespaced node name plus its inputs and outputs — so
re-tagging a node never changes its ID.
"""

from __future__ import annotations

import json
from typing import Any

from kedro_viz.utils import _hash, _hash_input_output


def dataset_node_id(dataset_name: str) -> str:
    """Return the Viz graph ID for a data or parameter node.

    Transcoded names (``name@suffix``) hash on the base name, matching the backend.
    """
    return _hash_input_output(dataset_name)


def task_node_id(node_name: str, inputs: list[str], outputs: list[str]) -> str:
    """Return the Viz graph ID for a task node.

    Hashes only identity-defining fields — the namespaced node name plus its inputs and
    outputs — and deliberately excludes tags, so re-tagging a node never changes its ID.
    The fields are JSON-serialized so the encoding is unambiguous (e.g. a single input
    ``"a,b"`` never collides with two inputs ``"a"``, ``"b"``); the resulting array string
    also keeps the hash distinct from a bare dataset name (see :func:`dataset_node_id`).

    Args:
        node_name: ``NodeSnapshot.name`` (already namespace-prefixed).
        inputs: Node input names, in declaration order.
        outputs: Node output names, in declaration order.
    """
    signature = json.dumps([node_name, inputs, outputs])
    return _hash(signature)


def task_node_id_for(node: Any) -> str:
    """``task_node_id`` for a node-like object exposing ``name``/``inputs``/``outputs``.

    Works for both a Kedro ``Node`` (live path) and a snapshot ``NodeSnapshot`` (adapter).
    """
    return task_node_id(node.name, list(node.inputs), list(node.outputs))
