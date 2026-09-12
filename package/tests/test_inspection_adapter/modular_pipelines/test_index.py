"""Tests for the modular-pipeline dataset index."""


def test_dataset_belongs_to_every_enclosing_modular_pipeline(
    _node, _modular_pipeline_index
) -> None:
    """A boundary dataset belongs to the nested pipeline and each of its ancestors."""
    node = _node("a.b.task", ["x"], ["y"], namespace="a.b")
    index = _modular_pipeline_index([node])
    assert index.modular_pipelines_for_dataset("x") == ["a", "a.b"]
    assert index.modular_pipelines_for_dataset("y") == ["a", "a.b"]


def test_parameters_never_belong_to_a_modular_pipeline(
    _node, _modular_pipeline_index
) -> None:
    node = _node("ns.task", ["params:opts"], ["y"], namespace="ns")
    index = _modular_pipeline_index([node])
    assert index.modular_pipelines_for_dataset("params:opts") is None


def test_unassigned_dataset_has_no_modular_pipelines(
    _node, _modular_pipeline_index
) -> None:
    node = _node("task", ["x"], ["y"])
    index = _modular_pipeline_index([node])
    assert index.modular_pipelines_for_dataset("x") is None


def test_modular_pipelines_for_dataset_accepts_a_transcoded_name(
    _node, _modular_pipeline_index
) -> None:
    nodes = [_node("ns.task", ["ds@pandas"], ["y"], namespace="ns")]
    index = _modular_pipeline_index(nodes)
    assert (
        index.modular_pipelines_for_dataset("ds@pandas")
        == index.modular_pipelines_for_dataset("ds")
        == ["ns"]
    )


def test_modular_pipeline_ids_can_be_recognized(_node, _modular_pipeline_index) -> None:
    index = _modular_pipeline_index(
        [_node("outer.inner.task", ["x"], ["y"], namespace="outer.inner")]
    )

    assert index.has_modular_pipeline("outer")
    assert index.has_modular_pipeline("outer.inner")
    assert not index.has_modular_pipeline("unknown")
