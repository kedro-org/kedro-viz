"""Tests for the node-metadata service's prepared-input boundary."""

import pytest

from kedro_viz.integrations.kedro.inspection import snapshot_source
from kedro_viz.integrations.kedro.inspection.errors import NodeNotFoundError
from kedro_viz.integrations.kedro.inspection.node_metadata_builder import (
    NodeMetadataBuilder,
)
from kedro_viz.integrations.kedro.inspection.node_metadata_service import (
    NodeMetadataService,
)
from kedro_viz.integrations.kedro.inspection.snapshot_source import InspectionInputs
from kedro_viz.models.metadata import NodeExtras


def test_service_builds_metadata_from_prepared_inputs_without_loading(mocker):
    inputs = mocker.Mock(
        spec=InspectionInputs,
        snapshot=mocker.sentinel.snapshot,
        parameters={"model": {"test_size": 0.2}},
    )
    builder = mocker.patch(
        "kedro_viz.integrations.kedro.inspection.node_metadata_service.NodeMetadataBuilder"
    )
    load_inputs = mocker.patch.object(snapshot_source, "load_inspection_inputs")
    extras = {"data": NodeExtras(stats={"rows": 3})}

    service = NodeMetadataService.from_inspection_inputs(inputs, enrichment=extras)

    builder.assert_called_once_with(
        inputs.snapshot,
        parameters=inputs.parameters,
        node_extras_by_name=extras,
    )
    load_inputs.assert_not_called()
    assert (
        service.get_node_metadata_response("node-id")
        is builder.return_value.build.return_value
    )
    builder.return_value.build.assert_called_once_with("node-id")


def test_service_propagates_unknown_node_errors(mocker):
    builder = mocker.Mock(spec=NodeMetadataBuilder)
    error = NodeNotFoundError("Invalid node ID: 'unknown'")
    builder.build.side_effect = error
    service = NodeMetadataService(builder)

    with pytest.raises(NodeNotFoundError) as exc_info:
        service.get_node_metadata_response("unknown")

    assert exc_info.value is error
