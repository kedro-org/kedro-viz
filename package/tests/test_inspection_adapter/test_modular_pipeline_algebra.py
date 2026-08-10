"""Hermetic tests for Kedro's modular pipeline set algebra on snapshot nodes."""

from types import SimpleNamespace
from typing import TYPE_CHECKING, cast

from kedro_viz.integrations.kedro.inspection.modular_pipeline_algebra import (
    _ancestor_namespaces,
    compute_namespace_boundaries,
)

if TYPE_CHECKING:
    from kedro.inspection.models import NodeSnapshot


def _node(
    inputs: list[str],
    outputs: list[str],
    *,
    namespace: str | None = None,
) -> SimpleNamespace:
    return SimpleNamespace(inputs=inputs, outputs=outputs, namespace=namespace)


def test_ancestor_namespaces_expands_every_level() -> None:
    assert _ancestor_namespaces("a.b.c") == ["a", "a.b", "a.b.c"]
    assert _ancestor_namespaces("solo") == ["solo"]


def test_transcoded_boundary_follows_pipeline_set_algebra() -> None:
    """Transcoding is stripped only when removing intermediates, matching Kedro."""
    nodes = [
        _node(["x"], ["shared@pandas1"], namespace="ns"),
        _node(["shared@pandas2"], ["y"], namespace="ns"),
        _node(["shared@pandas3"], ["z"]),
    ]

    boundaries = compute_namespace_boundaries(cast("list[NodeSnapshot]", nodes))

    assert boundaries.boundary_io_by_modular_pipeline["ns"] == ({"x"}, {"y"})
