"""Shared Kedro-Viz node-ID generation — one implementation for the adapter *and* the run-status hook.

This is the single source of truth for the new Viz-side node-ID scheme (Decision D9). It lives outside
``inspection/`` so non-inspection callers (notably ``integrations.kedro.hooks_utils.hash_node`` once the
runtime adopts the adapter in Phase 6.3) can import it without depending on the inspection adapter.

The old backend scheme ``_hash(str(node))`` needs the function name, which the inspection snapshot
omits. The new scheme hashes identity-defining fields only — the namespaced node name plus its
inputs and outputs — and is shipped as a one-time breaking release.
"""

from __future__ import annotations

import json

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
