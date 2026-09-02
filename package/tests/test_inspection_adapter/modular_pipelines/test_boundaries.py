"""Hermetic tests for modular-pipeline boundary calculations."""

from typing import TYPE_CHECKING, cast

from kedro_viz.integrations.kedro.inspection.modular_pipelines.boundaries import (
    _ancestor_namespaces,
    _compute_namespace_boundaries,
)

if TYPE_CHECKING:
    from kedro.inspection.models import NodeSnapshot


def test_ancestor_namespaces_expands_every_level() -> None:
    assert _ancestor_namespaces("a.b.c") == ["a", "a.b", "a.b.c"]
    assert _ancestor_namespaces("solo") == ["solo"]


def test_transcoded_boundary_follows_pipeline_set_algebra(_node) -> None:
    """Transcoding is stripped only when removing intermediates, matching Kedro."""
    nodes = [
        _node("ns.first", ["x"], ["shared@pandas1"], namespace="ns"),
        _node("ns.second", ["shared@pandas2"], ["y"], namespace="ns"),
        _node("outside", ["shared@pandas3"], ["z"]),
    ]

    boundaries = _compute_namespace_boundaries(cast("list[NodeSnapshot]", nodes))

    assert boundaries.boundary_io_by_modular_pipeline["ns"] == ({"x"}, {"y"})
