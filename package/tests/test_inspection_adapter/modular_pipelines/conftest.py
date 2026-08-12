"""Shared factories for modular-pipeline inspection tests."""

from types import SimpleNamespace
from typing import TYPE_CHECKING, Protocol, cast

import pytest

from kedro_viz.integrations.kedro.inspection.modular_pipelines import (
    ModularPipelineIndex,
)
from kedro_viz.integrations.kedro.inspection.modular_pipelines.tree import (
    _ModularPipelineTreeBuilder,
)

if TYPE_CHECKING:
    from kedro.inspection.models import NodeSnapshot


class _NodeFactory(Protocol):
    def __call__(
        self,
        name: str,
        inputs: list[str],
        outputs: list[str],
        *,
        namespace: str | None = None,
        tags: set[str] | None = None,
    ) -> SimpleNamespace: ...


class _TreeBuilderFactory(Protocol):
    def __call__(self, nodes: list[SimpleNamespace]) -> _ModularPipelineTreeBuilder: ...


class _ModularPipelineIndexFactory(Protocol):
    def __call__(self, nodes: list[SimpleNamespace]) -> ModularPipelineIndex: ...


@pytest.fixture
def _node() -> _NodeFactory:
    def make_node(
        name: str,
        inputs: list[str],
        outputs: list[str],
        *,
        namespace: str | None = None,
        tags: set[str] | None = None,
    ) -> SimpleNamespace:
        local_name = name.removeprefix(f"{namespace}.") if namespace else name
        return SimpleNamespace(
            name=name,
            func_name=local_name,
            inputs=inputs,
            outputs=outputs,
            namespace=namespace,
            tags=tags or set(),
        )

    return make_node


@pytest.fixture
def _tree_builder() -> _TreeBuilderFactory:
    def make_tree_builder(
        nodes: list[SimpleNamespace],
    ) -> _ModularPipelineTreeBuilder:
        return _ModularPipelineTreeBuilder(cast("list[NodeSnapshot]", nodes))

    return make_tree_builder


@pytest.fixture
def _modular_pipeline_index() -> _ModularPipelineIndexFactory:
    def make_index(nodes: list[SimpleNamespace]) -> ModularPipelineIndex:
        return ModularPipelineIndex.from_nodes(cast("list[NodeSnapshot]", nodes))

    return make_index
