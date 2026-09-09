"""Tests for static node metadata prepared from inspection inputs."""

from __future__ import annotations

import json
from collections.abc import Iterable
from dataclasses import dataclass

import pytest
from kedro.inspection.models import (
    DatasetSnapshot,
    NodeSnapshot,
    PipelineSnapshot,
    ProjectMetadataSnapshot,
    ProjectSnapshot,
)
from pydantic import BaseModel, Field, field_serializer

from kedro_viz.api.rest.responses.nodes import (
    DataNodeMetadataAPIResponse,
    ParametersNodeMetadataAPIResponse,
    TaskNodeMetadataAPIResponse,
    TranscodedDataNodeMetadataAPIReponse,
)
from kedro_viz.api.rest.responses.utils import get_encoded_response
from kedro_viz.integrations.kedro.inspection.errors import (
    NodeMetadataNotAvailableError,
    NodeNotFoundError,
)
from kedro_viz.integrations.kedro.inspection.graph_service import GraphService
from kedro_viz.integrations.kedro.inspection.node_metadata_builder import (
    NodeMetadataBuilder,
)
from kedro_viz.integrations.kedro.inspection.node_metadata_service import (
    NodeMetadataService,
)
from kedro_viz.integrations.kedro.inspection.snapshot_source import (
    InspectionInputs,
    filter_inspection_inputs,
)
from kedro_viz.integrations.kedro.node_ids import (
    _create_dataset_node_id,
    _create_task_node_id_from_node_snapshot,
)
from kedro_viz.models.metadata import NodeExtras


class _ModelOptions(BaseModel):
    count: int


class _SerializedOptions(BaseModel):
    value: int = Field(alias="v")

    @field_serializer("value")
    def _serialize_value(self, value: int) -> str:
        return f"n={value}"


@dataclass
class _DataclassOptions:
    count: int


def _node(
    name: str,
    *,
    inputs: Iterable[str] = (),
    outputs: Iterable[str] = (),
    func_name: str | None = None,
    namespace: str | None = None,
) -> NodeSnapshot:
    return NodeSnapshot(
        name=name,
        func_name=func_name or name.rsplit(".", maxsplit=1)[-1],
        namespace=namespace,
        inputs=list(inputs),
        outputs=list(outputs),
    )


def _pipeline(
    name: str,
    nodes: Iterable[NodeSnapshot],
    *,
    inputs: Iterable[str] = (),
    outputs: Iterable[str] = (),
) -> PipelineSnapshot:
    return PipelineSnapshot(
        name=name,
        nodes=list(nodes),
        inputs=list(inputs),
        outputs=list(outputs),
    )


def _snapshot(
    pipelines: Iterable[PipelineSnapshot],
    datasets: Iterable[DatasetSnapshot] = (),
) -> ProjectSnapshot:
    return ProjectSnapshot(
        metadata=ProjectMetadataSnapshot(
            project_name="project",
            package_name="project",
            kedro_version="1.0.0",
        ),
        pipelines=list(pipelines),
        datasets={dataset.name: dataset for dataset in datasets},
        parameters=[],
    )


def _builder(
    snapshot: ProjectSnapshot,
    *,
    parameters: dict | None = None,
    node_extras_by_name: dict[str, NodeExtras] | None = None,
) -> NodeMetadataBuilder:
    return NodeMetadataBuilder(
        snapshot,
        parameters=parameters or {},
        node_extras_by_name=node_extras_by_name,
    )


def test_task_metadata_uses_snapshot_fields_and_shared_graph_id() -> None:
    task = _node(
        "training.train",
        func_name="train",
        namespace="training",
        inputs=["params:model.test_size", "features"],
        outputs=["model"],
    )
    builder = _builder(
        _snapshot([_pipeline("__default__", [task], inputs=["features"])]),
        parameters={"model": {"test_size": 0.2}},
    )

    response = builder.build(_create_task_node_id_from_node_snapshot(task))

    assert isinstance(response, TaskNodeMetadataAPIResponse)
    assert response.model_dump() == {
        "code": None,
        "filepath": None,
        "parameters": {"model.test_size": 0.2},
        "inputs": ["params:model.test_size", "features"],
        "outputs": ["model"],
        "run_command": "kedro run --to-nodes='training.train'",
        "preview": None,
    }


@pytest.mark.parametrize(
    ("reference", "expected"),
    [
        ("parameters", {"model": {"test_size": 0.2}}),
        ("params:model.test_size", {"model.test_size": 0.2}),
        ("params:model.missing", {"model.missing": None}),
    ],
)
def test_parameter_metadata_uses_resolved_config(
    reference: str,
    expected: dict,
) -> None:
    task = _node("train", inputs=[reference])
    builder = _builder(
        _snapshot([_pipeline("__default__", [task], inputs=[reference])]),
        parameters={"model": {"test_size": 0.2}},
    )

    response = builder.build(_create_dataset_node_id(reference))

    assert isinstance(response, ParametersNodeMetadataAPIResponse)
    assert response.parameters == expected


@pytest.mark.parametrize(
    ("parameters", "expected"),
    [
        ({"literal.key": 7}, None),
        ({"literal": {"key": 8}}, 8),
        ({"literal.key": 7, "literal": {"key": 8}}, 8),
        ({"literal": {"key": 8}, "literal.key": 7}, 8),
    ],
)
def test_parameter_metadata_preserves_existing_nested_lookup(
    parameters: dict, expected: int | None
) -> None:
    task = _node("train", inputs=["params:literal.key"])
    builder = _builder(
        _snapshot([_pipeline("__default__", [task], inputs=["params:literal.key"])]),
        parameters=parameters,
    )

    task_response = builder.build(_create_task_node_id_from_node_snapshot(task))
    parameter_response = builder.build(_create_dataset_node_id("params:literal.key"))

    assert isinstance(task_response, TaskNodeMetadataAPIResponse)
    assert task_response.parameters == {"literal.key": expected}
    assert isinstance(parameter_response, ParametersNodeMetadataAPIResponse)
    assert parameter_response.parameters == {"literal.key": expected}


def test_typed_parameter_values_are_preserved_without_field_expansion() -> None:
    task = _node(
        "train",
        inputs=[
            "parameters",
            "params:model_options.count",
            "params:dataclass_options.count",
        ],
    )
    builder = _builder(
        _snapshot([_pipeline("__default__", [task])]),
        parameters={
            "model_options": _ModelOptions(count=3),
            "dataclass_options": _DataclassOptions(count=4),
        },
    )

    task_response = builder.build(_create_task_node_id_from_node_snapshot(task))
    parameter_response = builder.build(_create_dataset_node_id("parameters"))

    assert isinstance(task_response, TaskNodeMetadataAPIResponse)
    assert task_response.parameters is not None
    assert isinstance(task_response.parameters["model_options"], _ModelOptions)
    assert isinstance(task_response.parameters["dataclass_options"], _DataclassOptions)
    assert json.loads(get_encoded_response(task_response))["parameters"] == {
        "model_options": {"count": 3},
        "dataclass_options": {"count": 4},
        "model_options.count": None,
        "dataclass_options.count": None,
    }
    assert isinstance(parameter_response, ParametersNodeMetadataAPIResponse)
    assert json.loads(get_encoded_response(parameter_response))["parameters"] == {
        "model_options": {"count": 3},
        "dataclass_options": {"count": 4},
    }


def test_fresh_responses_preserve_nested_parameter_serializers() -> None:
    task = _node("train", inputs=["parameters"])
    builder = _builder(
        _snapshot([_pipeline("__default__", [task])]),
        parameters={"options": _SerializedOptions(v=3)},
    )

    task_response = builder.build(_create_task_node_id_from_node_snapshot(task))
    parameter_response = builder.build(_create_dataset_node_id("parameters"))

    assert json.loads(get_encoded_response(task_response))["parameters"] == {
        "options": {"v": "n=3"}
    }
    assert json.loads(get_encoded_response(parameter_response))["parameters"] == {
        "options": {"v": "n=3"}
    }


def test_plain_dataset_metadata_covers_free_output_and_memory_datasets() -> None:
    task = _node(
        "build",
        inputs=["registered_free", "unregistered"],
        outputs=["produced", "without_filepath"],
    )
    snapshot = _snapshot(
        [
            _pipeline(
                "__default__",
                [task],
                inputs=["registered_free", "unregistered"],
            )
        ],
        [
            DatasetSnapshot(
                name="registered_free",
                type="pandas.CSVDataset",
                filepath="data/free.csv",
            ),
            DatasetSnapshot(
                name="produced",
                type="pandas.ParquetDataset",
                filepath="data/produced.parquet",
            ),
            DatasetSnapshot(name="without_filepath", type="json.JSONDataset"),
        ],
    )
    builder = _builder(snapshot)

    free = builder.build(_create_dataset_node_id("registered_free"))
    memory = builder.build(_create_dataset_node_id("unregistered"))
    produced = builder.build(_create_dataset_node_id("produced"))
    without_filepath = builder.build(_create_dataset_node_id("without_filepath"))

    assert isinstance(free, DataNodeMetadataAPIResponse)
    assert free.filepath == "data/free.csv"
    assert free.type == "pandas.CSVDataset"
    assert free.run_command is None
    assert isinstance(memory, DataNodeMetadataAPIResponse)
    assert memory.type == "io.memory_dataset.MemoryDataset"
    assert memory.run_command is None
    assert isinstance(produced, DataNodeMetadataAPIResponse)
    assert produced.filepath == "data/produced.parquet"
    assert produced.type == "pandas.ParquetDataset"
    assert produced.run_command == "kedro run --to-outputs=produced"
    assert isinstance(without_filepath, DataNodeMetadataAPIResponse)
    assert without_filepath.filepath is None


def test_dataset_stats_are_name_keyed_and_styles_do_not_change_detail_shape() -> None:
    task = _node("build", outputs=["companies"])
    extras = NodeExtras(
        stats={"rows": 7},
        styles={"color": "blue"},
    )
    builder = _builder(
        _snapshot(
            [_pipeline("__default__", [task])],
            [DatasetSnapshot(name="companies", type="pandas.CSVDataset")],
        ),
        node_extras_by_name={"companies": extras},
    )

    response = builder.build(_create_dataset_node_id("companies"))

    assert isinstance(response, DataNodeMetadataAPIResponse)
    assert response.stats == {"rows": 7}
    assert "styles" not in response.model_dump()


def test_transcoded_metadata_uses_producer_and_ordered_consumer_variants() -> None:
    produce = _node("produce", outputs=["model@csv"])
    consume = _node(
        "consume",
        inputs=["model@parquet", "model@spark"],
        outputs=["report"],
    )
    default = _pipeline("__default__", [produce, consume])
    duplicate = _pipeline("modelling", [produce, consume])
    builder = _builder(
        _snapshot(
            [default, duplicate],
            [
                DatasetSnapshot(
                    name="model@csv",
                    type="pandas.CSVDataset",
                    filepath="data/model.csv",
                ),
                DatasetSnapshot(
                    name="model@parquet",
                    type="pandas.ParquetDataset",
                    filepath="data/model.parquet",
                ),
                DatasetSnapshot(
                    name="model@spark",
                    type="spark.SparkDataset",
                    filepath="data/model.spark",
                ),
            ],
        ),
        node_extras_by_name={"model": NodeExtras(stats={"rows": 10})},
    )

    response = builder.build(_create_dataset_node_id("model@csv"))

    assert isinstance(response, TranscodedDataNodeMetadataAPIReponse)
    assert response.model_dump() == {
        "filepath": "data/model.csv",
        "original_type": "pandas.CSVDataset",
        "transcoded_types": [
            "pandas.ParquetDataset",
            "spark.SparkDataset",
        ],
        "run_command": "kedro run --to-outputs=model@csv",
        "stats": {"rows": 10},
    }


def test_interleaved_transcoded_inputs_keep_distinct_ordered_variants() -> None:
    produce = _node("produce", outputs=["alpha@csv", "beta@spark"])
    consume = _node(
        "consume",
        inputs=[
            "alpha@spark",
            "beta@csv",
            "alpha@parquet",
            "beta@json",
            "alpha@spark",
            "beta@csv",
        ],
    )
    builder = _builder(
        _snapshot(
            [
                _pipeline("first", [produce, consume]),
                _pipeline("repeated", [consume]),
            ],
            [
                DatasetSnapshot(name=f"{name}@{variant}", type=f"test.{variant}")
                for name in ("alpha", "beta")
                for variant in ("csv", "spark", "parquet", "json")
            ],
        )
    )

    alpha = builder.build(_create_dataset_node_id("alpha"))
    beta = builder.build(_create_dataset_node_id("beta"))

    assert isinstance(alpha, TranscodedDataNodeMetadataAPIReponse)
    assert isinstance(beta, TranscodedDataNodeMetadataAPIReponse)
    assert alpha.original_type == "test.csv"
    assert alpha.transcoded_types == ["test.spark", "test.parquet"]
    assert beta.original_type == "test.spark"
    assert beta.transcoded_types == ["test.csv", "test.json"]


def test_last_transcoded_producer_matches_live_repository_assignment() -> None:
    first = _node("first", outputs=["model@csv"])
    second = _node("second", outputs=["model@json"])
    builder = _builder(
        _snapshot(
            [
                _pipeline("first_pipeline", [first]),
                _pipeline("second_pipeline", [second]),
            ],
            [
                DatasetSnapshot(name="model@csv", type="pandas.CSVDataset"),
                DatasetSnapshot(
                    name="model@json",
                    type="json.JSONDataset",
                    filepath="data/model.json",
                ),
            ],
        )
    )

    response = builder.build(_create_dataset_node_id("model"))

    assert isinstance(response, TranscodedDataNodeMetadataAPIReponse)
    assert response.filepath == "data/model.json"
    assert response.original_type == "json.JSONDataset"
    assert response.run_command == "kedro run --to-outputs=model@json"


def test_plain_reference_first_keeps_plain_metadata_across_pipelines() -> None:
    plain = _node("plain", outputs=["asset"])
    transcoded = _node("transcoded", outputs=["asset@csv"])
    builder = _builder(
        _snapshot(
            [
                _pipeline("plain_pipeline", [plain]),
                _pipeline("transcoded_pipeline", [transcoded]),
            ],
            [
                DatasetSnapshot(name="asset", type="io.MemoryDataset"),
                DatasetSnapshot(name="asset@csv", type="pandas.CSVDataset"),
            ],
        )
    )

    response = builder.build(_create_dataset_node_id("asset"))

    assert isinstance(response, DataNodeMetadataAPIResponse)
    assert response.type == "io.MemoryDataset"
    assert response.run_command == "kedro run --to-outputs=asset"


@pytest.mark.parametrize("transcoded_first", [False, True])
def test_shared_index_preserves_graph_scope_and_metadata_encounter_order(
    transcoded_first: bool,
) -> None:
    plain = _pipeline("plain", [_node("plain", outputs=["asset"])])
    transcoded = _pipeline("transcoded", [_node("transcoded", outputs=["asset@csv"])])
    pipelines = [transcoded, plain] if transcoded_first else [plain, transcoded]
    inputs = InspectionInputs(
        snapshot=_snapshot(
            pipelines,
            [
                DatasetSnapshot(name="asset", type="io.MemoryDataset"),
                DatasetSnapshot(name="asset@csv", type="pandas.CSVDataset"),
            ],
        )
    )
    graph = GraphService.from_inspection_inputs(inputs)
    metadata = NodeMetadataService.from_inspection_inputs(inputs)
    node_id = _create_dataset_node_id("asset")

    plain_node = next(
        node
        for node in graph.get_pipeline_response("plain").nodes
        if node.id == node_id
    )
    transcoded_node = next(
        node
        for node in graph.get_pipeline_response("transcoded").nodes
        if node.id == node_id
    )
    assert plain_node.model_dump()["dataset_type"] == "io.MemoryDataset"
    assert transcoded_node.model_dump()["dataset_type"] is None
    response = metadata.get_node_metadata_response(node_id)
    expected_type = (
        TranscodedDataNodeMetadataAPIReponse
        if transcoded_first
        else DataNodeMetadataAPIResponse
    )
    assert isinstance(response, expected_type)


def test_transcoded_reference_first_accepts_later_plain_producer() -> None:
    transcoded = _node("transcoded", outputs=["asset@csv"])
    plain = _node("plain", outputs=["asset"])
    builder = _builder(
        _snapshot(
            [
                _pipeline("transcoded_pipeline", [transcoded]),
                _pipeline("plain_pipeline", [plain]),
            ],
            [
                DatasetSnapshot(name="asset@csv", type="pandas.CSVDataset"),
                DatasetSnapshot(name="asset", type="io.MemoryDataset"),
            ],
        )
    )

    response = builder.build(_create_dataset_node_id("asset"))

    assert isinstance(response, TranscodedDataNodeMetadataAPIReponse)
    assert response.original_type == "io.MemoryDataset"
    assert response.run_command == "kedro run --to-outputs=asset"


def test_transcoded_reference_first_collects_later_plain_input() -> None:
    produce = _node("produce", outputs=["asset@csv"])
    consume = _node("consume", inputs=["asset"])
    builder = _builder(
        _snapshot(
            [
                _pipeline("transcoded_pipeline", [produce]),
                _pipeline("plain_pipeline", [consume]),
            ],
            [
                DatasetSnapshot(name="asset@csv", type="pandas.CSVDataset"),
                DatasetSnapshot(name="asset", type="io.MemoryDataset"),
            ],
        )
    )

    response = builder.build(_create_dataset_node_id("asset"))

    assert isinstance(response, TranscodedDataNodeMetadataAPIReponse)
    assert response.original_type == "pandas.CSVDataset"
    assert response.transcoded_types == ["io.MemoryDataset"]
    assert response.run_command == "kedro run --to-outputs=asset@csv"


@pytest.mark.parametrize(
    ("pipeline_name", "expected_type", "expected_run_command"),
    [
        (
            "plain_pipeline",
            DataNodeMetadataAPIResponse,
            "kedro run --to-outputs=asset",
        ),
        (
            "transcoded_pipeline",
            TranscodedDataNodeMetadataAPIReponse,
            "kedro run --to-outputs=asset@csv",
        ),
    ],
)
def test_filtered_mixed_dataset_uses_only_selected_pipeline_references(
    pipeline_name: str,
    expected_type: type[
        DataNodeMetadataAPIResponse | TranscodedDataNodeMetadataAPIReponse
    ],
    expected_run_command: str,
) -> None:
    inspection_inputs = InspectionInputs(
        snapshot=_snapshot(
            [
                _pipeline("plain_pipeline", [_node("plain", outputs=["asset"])]),
                _pipeline(
                    "transcoded_pipeline",
                    [_node("transcoded", outputs=["asset@csv"])],
                ),
            ],
            [
                DatasetSnapshot(name="asset", type="io.MemoryDataset"),
                DatasetSnapshot(name="asset@csv", type="pandas.CSVDataset"),
            ],
        )
    )
    filtered = filter_inspection_inputs(inspection_inputs, pipeline_name)
    builder = NodeMetadataBuilder(
        filtered.snapshot,
        parameters=filtered.parameters,
    )

    response = builder.build(_create_dataset_node_id("asset"))

    assert isinstance(response, expected_type)
    assert response.run_command == expected_run_command


def test_free_transcoded_input_has_useful_static_metadata() -> None:
    consume = _node("consume", inputs=["asset@csv", "asset@parquet"])
    builder = _builder(
        _snapshot(
            [
                _pipeline(
                    "__default__",
                    [consume],
                    inputs=["asset@csv", "asset@parquet"],
                )
            ],
            [
                DatasetSnapshot(
                    name="asset@csv",
                    type="pandas.CSVDataset",
                    filepath="data/asset.csv",
                ),
                DatasetSnapshot(name="asset@parquet", type="pandas.ParquetDataset"),
            ],
        )
    )

    response = builder.build(_create_dataset_node_id("asset"))

    assert isinstance(response, TranscodedDataNodeMetadataAPIReponse)
    assert response.filepath == "data/asset.csv"
    assert response.original_type == "pandas.CSVDataset"
    assert response.transcoded_types == ["pandas.ParquetDataset"]
    assert response.run_command is None


def test_first_seen_free_transcoded_input_stays_free_when_later_produced() -> None:
    consume = _node("consume", inputs=["asset@csv"])
    produce = _node("produce", outputs=["asset@parquet"])
    builder = _builder(
        _snapshot(
            [
                _pipeline("consumer", [consume], inputs=["asset@csv"]),
                _pipeline("producer", [produce]),
            ],
            [
                DatasetSnapshot(name="asset@csv", type="pandas.CSVDataset"),
                DatasetSnapshot(name="asset@parquet", type="pandas.ParquetDataset"),
            ],
        )
    )

    response = builder.build(_create_dataset_node_id("asset"))

    assert isinstance(response, TranscodedDataNodeMetadataAPIReponse)
    assert response.original_type == "pandas.ParquetDataset"
    assert response.run_command is None


def test_missing_transcoded_catalog_entry_uses_memory_dataset_type() -> None:
    produce = _node("produce", outputs=["model@csv"])
    consume = _node("consume", inputs=["model@missing"])
    builder = _builder(
        _snapshot(
            [_pipeline("__default__", [produce, consume])],
            [DatasetSnapshot(name="model@csv", type="pandas.CSVDataset")],
        )
    )

    response = builder.build(_create_dataset_node_id("model"))

    assert isinstance(response, TranscodedDataNodeMetadataAPIReponse)
    assert response.transcoded_types == ["io.memory_dataset.MemoryDataset"]


def test_known_modular_id_has_no_metadata() -> None:
    builder = _builder(
        _snapshot(
            [
                _pipeline(
                    "__default__",
                    [_node("group.task", namespace="group")],
                )
            ]
        )
    )

    with pytest.raises(NodeMetadataNotAvailableError, match="not available"):
        builder.build("group")


def test_unknown_id_is_rejected() -> None:
    builder = _builder(_snapshot([_pipeline("__default__", [_node("task")])]))

    for node_id in ["unknown", "a.modular.pipeline"]:
        with pytest.raises(NodeNotFoundError, match="Invalid node ID"):
            builder.build(node_id)


def test_each_lookup_returns_fresh_validated_metadata() -> None:
    builder = _builder(
        _snapshot([_pipeline("__default__", [_node("build", outputs=["data"])])])
    )

    first = builder.build(_create_dataset_node_id("data"))
    assert isinstance(first, DataNodeMetadataAPIResponse)
    first.type = "changed"

    second = builder.build(_create_dataset_node_id("data"))
    assert isinstance(second, DataNodeMetadataAPIResponse)
    assert second.type == "io.memory_dataset.MemoryDataset"
    assert second is not first


def test_metadata_service_resolves_all_supported_graph_node_ids() -> None:
    task = _node(
        "build",
        inputs=["params:model.test_size", "input"],
        outputs=["output"],
    )
    snapshot = _snapshot(
        [_pipeline("__default__", [task], inputs=["input"])],
        [DatasetSnapshot(name="input", type="pandas.CSVDataset")],
    )
    inspection_inputs = InspectionInputs(
        snapshot=snapshot,
        parameters={"model": {"test_size": 0.2}},
    )
    graph = GraphService.from_inspection_inputs(inspection_inputs)

    metadata = NodeMetadataService.from_inspection_inputs(inspection_inputs)
    graph_response = graph.get_pipeline_response()

    assert graph_response.nodes
    for graph_node in graph_response.nodes:
        assert metadata.get_node_metadata_response(graph_node.id)


def test_filtered_inspection_inputs_excludes_off_pipeline_metadata() -> None:
    included = _node("included", outputs=["included_data"])
    excluded = _node("excluded", outputs=["excluded_data"])
    inspection_inputs = InspectionInputs(
        snapshot=_snapshot(
            [
                _pipeline("included_pipeline", [included]),
                _pipeline("excluded_pipeline", [excluded]),
            ]
        )
    )
    filtered = filter_inspection_inputs(inspection_inputs, "included_pipeline")
    builder = NodeMetadataBuilder(
        filtered.snapshot,
        parameters=filtered.parameters,
    )

    assert builder.build(_create_task_node_id_from_node_snapshot(included))
    with pytest.raises(NodeNotFoundError):
        builder.build(_create_task_node_id_from_node_snapshot(excluded))
