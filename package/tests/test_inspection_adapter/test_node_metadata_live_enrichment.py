"""Tests for exact-ID live enrichment of inspection-backed node metadata."""

from collections.abc import Iterable

import pytest
from kedro.inspection.models import (
    DatasetSnapshot,
    NodeSnapshot,
    PipelineSnapshot,
    ProjectMetadataSnapshot,
    ProjectSnapshot,
)
from kedro.io import MemoryDataset
from kedro.pipeline.node import node
from kedro_datasets.pandas import CSVDataset, ParquetDataset
from pydantic import BaseModel, Field, field_serializer

from kedro_viz.api.rest.responses.nodes import (
    DataNodeMetadataAPIResponse,
    ParametersNodeMetadataAPIResponse,
    TaskNodeMetadataAPIResponse,
    TranscodedDataNodeMetadataAPIReponse,
)
from kedro_viz.api.rest.responses.utils import get_encoded_response
from kedro_viz.integrations.kedro.inspection.node_metadata_service import (
    NodeMetadataService,
)
from kedro_viz.integrations.kedro.inspection.parameters import build_parameter_feed
from kedro_viz.integrations.kedro.node_ids import (
    _create_dataset_node_id,
    _create_task_node_id_from_node_snapshot,
)
from kedro_viz.models.flowchart.nodes import DataNode, GraphNode, TranscodedDataNode
from kedro_viz.models.metadata import NodeExtras


class _SerializedOptions(BaseModel):
    value: int = Field(alias="v")

    @field_serializer("value")
    def _serialize_value(self, value: int) -> str:
        return f"n={value}"


class _PreviewDataset(MemoryDataset):
    def __init__(self) -> None:
        super().__init__(data={"value": 1})
        self.release_calls = 0
        self.preview_calls = 0

    def release(self) -> None:
        self.release_calls += 1

    def _describe(self) -> dict:
        return {"filepath": "live.csv"}

    def preview(self) -> str:
        self.preview_calls += 1
        return "live preview"


def identity(value):
    return value


def produce_value():
    return None


def _node(
    name: str,
    *,
    inputs: Iterable[str] = (),
    outputs: Iterable[str] = (),
) -> NodeSnapshot:
    return NodeSnapshot(
        name=name,
        func_name=name,
        inputs=list(inputs),
        outputs=list(outputs),
    )


def _snapshot(
    nodes: Iterable[NodeSnapshot],
    *,
    datasets: Iterable[DatasetSnapshot] = (),
    inputs: Iterable[str] = (),
) -> ProjectSnapshot:
    return ProjectSnapshot(
        metadata=ProjectMetadataSnapshot(
            project_name="project",
            package_name="project",
            kedro_version="1.0.0",
        ),
        pipelines=[
            PipelineSnapshot(
                name="__default__",
                nodes=list(nodes),
                inputs=list(inputs),
            )
        ],
        datasets={dataset.name: dataset for dataset in datasets},
        parameters=[],
    )


def _service(
    snapshot: ProjectSnapshot,
    *,
    parameters: dict | None = None,
    node_extras_by_name: dict[str, NodeExtras] | None = None,
    live_nodes_by_id: dict | None = None,
) -> NodeMetadataService:
    return NodeMetadataService(
        snapshot,
        parameter_feed=build_parameter_feed(parameters or {}),
        node_extras_by_name=node_extras_by_name,
        live_nodes_by_id=live_nodes_by_id,
    )


def test_task_enrichment_preserves_static_fields_and_parameter_serializers() -> None:
    from kedro.pipeline.preview_contract import TextPreview

    snapshot_node = _node("identity", inputs=["parameters"], outputs=["result"])
    task_id = _create_task_node_id_from_node_snapshot(snapshot_node)
    kedro_node = node(
        identity,
        inputs="parameters",
        outputs="result",
        name="identity",
        preview_fn=lambda: TextPreview(content="preview"),
    )
    live_task = GraphNode.create_task_node(kedro_node, task_id, set())
    service = _service(
        _snapshot([snapshot_node]),
        parameters={"options": _SerializedOptions(v=3)},
        live_nodes_by_id={task_id: live_task},
    )

    response = service.get_node_metadata_response(
        task_id,
        include_previews=False,
    )

    assert isinstance(response, TaskNodeMetadataAPIResponse)
    assert response.code is not None and "def identity(value)" in response.code
    assert response.filepath is not None
    assert response.preview == {
        "kind": "text",
        "content": "preview",
        "meta": None,
    }
    assert response.inputs == ["parameters"]
    assert response.outputs == ["result"]
    assert response.run_command == "kedro run --to-nodes='identity'"
    assert b'"v": "n=3"' in get_encoded_response(response)


def test_data_enrichment_releases_once_per_lookup_and_respects_preview_policy() -> None:
    snapshot_node = _node("produce", outputs=["data"])
    data_id = _create_dataset_node_id("data")
    dataset = _PreviewDataset()
    live_data = GraphNode.create_data_node(
        dataset_id=data_id,
        dataset_name="data",
        layer=None,
        tags=set(),
        dataset=dataset,
        node_extras=None,
        modular_pipelines=set(),
    )
    assert isinstance(live_data, DataNode)
    service = _service(
        _snapshot(
            [snapshot_node],
            datasets=[
                DatasetSnapshot(
                    name="data",
                    type="test.RawDataset",
                    filepath="static.csv",
                )
            ],
        ),
        node_extras_by_name={"data": NodeExtras(stats={"rows": 1})},
        live_nodes_by_id={data_id: live_data},
    )
    assert dataset.release_calls == 0
    assert dataset.preview_calls == 0

    without_preview = service.get_node_metadata_response(
        data_id,
        include_previews=False,
    )
    with_preview = service.get_node_metadata_response(data_id)

    assert isinstance(without_preview, DataNodeMetadataAPIResponse)
    assert (
        without_preview.type
        == "test_inspection_adapter.test_node_metadata_live_enrichment._PreviewDataset"
    )
    assert without_preview.filepath == "live.csv"
    assert without_preview.preview is None
    assert without_preview.preview_type is None
    assert without_preview.run_command == "kedro run --to-outputs=data"
    assert without_preview.stats == {"rows": 1}
    assert isinstance(with_preview, DataNodeMetadataAPIResponse)
    assert with_preview.preview == "live preview"
    assert with_preview.preview_type == "str"
    assert dataset.release_calls == 2
    assert dataset.preview_calls == 1


def test_live_mapping_is_copied_and_restricted_to_supported_exact_ids() -> None:
    snapshot_node = _node("produce", outputs=["data"])
    data_id = _create_dataset_node_id("data")
    live_data = GraphNode.create_data_node(
        dataset_id=data_id,
        dataset_name="data",
        layer=None,
        tags=set(),
        dataset=_PreviewDataset(),
        node_extras=None,
        modular_pipelines=set(),
    )
    assert isinstance(live_data, DataNode)
    extra_task = GraphNode.create_task_node(
        node(produce_value, inputs=None, outputs="unused", name="extra"),
        "extra-id",
        set(),
    )
    live_nodes = {data_id: live_data, "extra-id": extra_task}
    service = _service(
        _snapshot([snapshot_node]),
        live_nodes_by_id=live_nodes,
    )

    live_nodes.clear()

    assert service._live_nodes_by_id == {data_id: live_data}
    response = service.get_node_metadata_response(data_id)
    assert isinstance(response, DataNodeMetadataAPIResponse)
    assert response.filepath == "live.csv"


def test_wrong_class_and_mismatched_object_id_do_not_enrich_static_metadata() -> None:
    snapshot_node = _node("produce", outputs=["data"])
    snapshot = _snapshot(
        [snapshot_node],
        datasets=[
            DatasetSnapshot(
                name="data",
                type="test.RawDataset",
                filepath="static.csv",
            )
        ],
    )
    data_id = _create_dataset_node_id("data")
    wrong_class = GraphNode.create_task_node(
        node(produce_value, inputs=None, outputs="unused", name="task"),
        data_id,
        set(),
    )
    mismatched_id = GraphNode.create_data_node(
        dataset_id="different-id",
        dataset_name="data",
        layer=None,
        tags=set(),
        dataset=_PreviewDataset(),
        node_extras=None,
        modular_pipelines=set(),
    )
    assert isinstance(mismatched_id, DataNode)
    missing_dataset = GraphNode.create_data_node(
        dataset_id=data_id,
        dataset_name="data",
        layer=None,
        tags=set(),
        dataset=None,
        node_extras=None,
        modular_pipelines=set(),
    )
    assert isinstance(missing_dataset, DataNode)

    for live_node in [wrong_class, mismatched_id, missing_dataset]:
        service = _service(snapshot, live_nodes_by_id={data_id: live_node})
        response = service.get_node_metadata_response(data_id)

        assert isinstance(response, DataNodeMetadataAPIResponse)
        assert response.type == "test.RawDataset"
        assert response.filepath == "static.csv"

    live_without_filepath = GraphNode.create_data_node(
        dataset_id=data_id,
        dataset_name="data",
        layer=None,
        tags=set(),
        dataset=MemoryDataset(),
        node_extras=None,
        modular_pipelines=set(),
    )
    service = _service(
        snapshot,
        live_nodes_by_id={data_id: live_without_filepath},
    )

    response = service.get_node_metadata_response(data_id)

    assert isinstance(response, DataNodeMetadataAPIResponse)
    assert response.filepath == "static.csv"


def test_transcoded_enrichment_preserves_static_command_stats_and_release_state(
    mocker,
) -> None:
    produce = _node("produce", outputs=["model@csv"])
    consume = _node("consume", inputs=["model@parquet", "model@memory"])
    model_id = _create_dataset_node_id("model")
    original = CSVDataset(filepath="live.csv")
    transcoded = ParquetDataset(filepath="live.parquet")
    memory = MemoryDataset()
    original_release = mocker.spy(original, "release")
    transcoded_release = mocker.spy(transcoded, "release")
    memory_release = mocker.spy(memory, "release")
    live_data = GraphNode.create_data_node(
        dataset_id=model_id,
        dataset_name="model@csv",
        layer=None,
        tags=set(),
        dataset=None,
        node_extras=None,
        modular_pipelines=set(),
    )
    assert isinstance(live_data, TranscodedDataNode)
    live_data.original_name = "model@csv"
    live_data.original_version = original
    live_data.transcoded_versions = {transcoded, memory}
    service = _service(
        _snapshot(
            [produce, consume],
            datasets=[
                DatasetSnapshot(name="model@csv", type="pandas.CSVDataset"),
                DatasetSnapshot(name="model@parquet", type="pandas.ParquetDataset"),
                DatasetSnapshot(name="model@memory", type="io.MemoryDataset"),
            ],
        ),
        node_extras_by_name={"model": NodeExtras(stats={"rows": 2})},
        live_nodes_by_id={model_id: live_data},
    )

    response = service.get_node_metadata_response(model_id)

    assert isinstance(response, TranscodedDataNodeMetadataAPIReponse)
    assert response.filepath == "live.csv"
    assert response.original_type == "pandas.csv_dataset.CSVDataset"
    assert set(response.transcoded_types) == {
        "pandas.parquet_dataset.ParquetDataset",
        "io.memory_dataset.MemoryDataset",
    }
    assert response.run_command == "kedro run --to-outputs=model@csv"
    assert response.stats == {"rows": 2}
    original_release.assert_not_called()
    transcoded_release.assert_not_called()
    memory_release.assert_not_called()


@pytest.mark.parametrize("original_version", [None, "not-a-dataset"])
def test_partial_transcoded_live_node_does_not_replace_static_fields(
    original_version,
) -> None:
    produce = _node("produce", outputs=["model@csv"])
    consume = _node(
        "consume",
        inputs=["model@parquet", "model@json"],
    )
    model_id = _create_dataset_node_id("model")
    live_data = GraphNode.create_data_node(
        dataset_id=model_id,
        dataset_name="model@csv",
        layer=None,
        tags=set(),
        dataset=None,
        node_extras=None,
        modular_pipelines=set(),
    )
    assert isinstance(live_data, TranscodedDataNode)
    live_data.original_version = original_version
    live_data.transcoded_versions = {ParquetDataset(filepath="live.parquet")}
    service = _service(
        _snapshot(
            [produce, consume],
            datasets=[
                DatasetSnapshot(
                    name="model@csv",
                    type="pandas.CSVDataset",
                    filepath="static.csv",
                ),
                DatasetSnapshot(name="model@parquet", type="pandas.ParquetDataset"),
                DatasetSnapshot(name="model@json", type="json.JSONDataset"),
            ],
        ),
        live_nodes_by_id={model_id: live_data},
    )

    response = service.get_node_metadata_response(model_id)

    assert isinstance(response, TranscodedDataNodeMetadataAPIReponse)
    assert response.filepath == "static.csv"
    assert response.original_type == "pandas.CSVDataset"
    assert response.transcoded_types == [
        "pandas.ParquetDataset",
        "json.JSONDataset",
    ]


def test_parameter_nodes_do_not_retain_or_apply_live_objects() -> None:
    snapshot_node = _node("consume", inputs=["params:value"])
    parameter_id = _create_dataset_node_id("params:value")
    live_parameter = GraphNode.create_parameters_node(
        dataset_id=parameter_id,
        dataset_name="params:value",
        layer=None,
        tags=set(),
        parameters=MemoryDataset(data=99),
        modular_pipelines=set(),
    )
    service = _service(
        _snapshot([snapshot_node], inputs=["params:value"]),
        parameters={"value": 1},
        live_nodes_by_id={parameter_id: live_parameter},
    )

    response = service.get_node_metadata_response(parameter_id)

    assert isinstance(response, ParametersNodeMetadataAPIResponse)
    assert response.parameters == {"value": 1}
    assert service._live_nodes_by_id == {}
