"""Unit tests for run_events.py module."""

import json
from pathlib import Path
from unittest import mock
from unittest.mock import patch

import pytest

from kedro_viz.api.rest.responses.run_events import (
    DatasetInfo,
    DatasetStatus,
    EventType,
    NodeInfo,
    NodeStatus,
    PipelineInfo,
    PipelineStatus,
    StructuredRunEventAPIResponse,
    _create_or_update_dataset_info,
    _extract_pipeline_timing_and_status,
    _finalize_pipeline_info,
    _process_dataset_error_event,
    _process_dataset_event,
    _process_node_completion_event,
    _process_node_error_event,
    get_run_events_response,
    transform_events_to_structured_format,
)


class TestModels:
    """Test Pydantic models and constants."""

    def test_constants(self):
        """Test key constants are defined correctly."""
        assert EventType.AFTER_NODE_RUN == "after_node_run"
        assert PipelineStatus.COMPLETED == "completed"
        assert NodeStatus.SUCCESS.value == "Success"
        assert DatasetStatus.AVAILABLE.value == "Available"

    def test_model_creation(self):
        """Test basic model creation with defaults."""
        node_info = NodeInfo()
        assert node_info.status == NodeStatus.SUCCESS
        assert node_info.duration_sec == 0.0

        dataset_info = DatasetInfo(name="test")
        assert dataset_info.name == "test"
        assert dataset_info.status == DatasetStatus.AVAILABLE

        pipeline_info = PipelineInfo()
        assert pipeline_info.status == PipelineStatus.COMPLETED

        response = StructuredRunEventAPIResponse()
        assert response.nodes == {}
        assert response.datasets == {}


class TestDatasetInfoUpdates:
    """Test dataset info creation and updates."""

    def test_create_new_dataset(self):
        """Test creating new dataset info."""
        datasets = {}
        _create_or_update_dataset_info(
            datasets, "dataset1", "test_dataset", 1024, "Available"
        )

        assert "dataset1" in datasets
        assert datasets["dataset1"].name == "test_dataset"
        assert datasets["dataset1"].size_bytes == 1024

    def test_update_existing_dataset(self):
        """Test updating existing dataset info."""
        datasets = {"dataset1": DatasetInfo(name="", size_bytes=0)}
        _create_or_update_dataset_info(
            datasets, "dataset1", "updated", 2048, "Available", overwrite_size=True
        )

        assert datasets["dataset1"].name == "updated"
        assert datasets["dataset1"].size_bytes == 2048

    def test_no_overwrite_size(self):
        """Test size not overwritten when flag is False."""
        datasets = {"dataset1": DatasetInfo(name="test", size_bytes=512)}
        _create_or_update_dataset_info(
            datasets, "dataset1", "test", 1024, "Available", overwrite_size=False
        )

        assert datasets["dataset1"].size_bytes == 512  # Should not change


class TestPipelineTimingExtraction:
    """Test pipeline timing and status extraction."""

    def test_extract_start_and_end_times(self):
        """Test extracting pipeline start and end times."""
        events = [
            {"event": "before_pipeline_run", "timestamp": "2023-01-01T10:00:00"},
            {"event": "after_pipeline_run", "timestamp": "2023-01-01T10:15:00"},
        ]
        pipeline_info = PipelineInfo()
        _extract_pipeline_timing_and_status(events, pipeline_info)

        assert pipeline_info.start_time == "2023-01-01T10:00:00"
        assert pipeline_info.end_time == "2023-01-01T10:15:00"
        assert pipeline_info.status == PipelineStatus.COMPLETED

    def test_extract_failed_pipeline(self):
        """Test extracting failed pipeline timing."""
        events = [
            {
                "event": "on_pipeline_error",
                "timestamp": "2023-01-01T10:05:00",
                "error": "Failed",
            },
        ]
        pipeline_info = PipelineInfo()
        _extract_pipeline_timing_and_status(events, pipeline_info)

        assert pipeline_info.end_time == "2023-01-01T10:05:00"
        assert pipeline_info.status == PipelineStatus.FAILED
        assert pipeline_info.error == "Failed"

    def test_no_timing_events(self):
        """Test handling when no timing events are present."""
        events = [{"event": "after_node_run", "node_id": "node1"}]
        pipeline_info = PipelineInfo()
        _extract_pipeline_timing_and_status(events, pipeline_info)

        assert pipeline_info.start_time is None
        assert pipeline_info.end_time is None


class TestEventProcessing:
    """Test individual event processing functions."""

    def test_process_node_completion(self):
        """Test processing node completion events."""
        event = {"node_id": "node1", "status": "Success", "duration_sec": 10.5}
        nodes = {}
        _process_node_completion_event(event, nodes)

        assert "node1" in nodes
        assert nodes["node1"].status == NodeStatus.SUCCESS
        assert nodes["node1"].duration_sec == 10.5

    def test_process_node_completion_missing_id(self):
        """Test processing node completion without node_id."""
        event = {"status": "Success"}
        nodes = {}
        _process_node_completion_event(event, nodes)
        assert len(nodes) == 0

    def test_process_node_error(self):
        """Test processing node error events."""
        event = {"node_id": "node1", "error": "Node failed", "traceback": "trace"}
        nodes = {}
        _process_node_error_event(event, nodes)

        assert "node1" in nodes
        assert nodes["node1"].status == NodeStatus.FAIL
        assert nodes["node1"].error.message == "Node failed"

    def test_process_node_error_existing_node(self):
        """Test processing error for existing node."""
        nodes = {"node1": NodeInfo(duration_sec=5.0)}
        event = {"node_id": "node1", "error": "Failed"}
        _process_node_error_event(event, nodes)

        assert nodes["node1"].status == NodeStatus.FAIL
        assert nodes["node1"].duration_sec == 5.0  # Preserved

    def test_process_node_error_missing_id(self):
        """Test processing node error without node_id."""
        event = {"error": "Node failed"}
        nodes = {}
        _process_node_error_event(event, nodes)
        assert len(nodes) == 0

    def test_process_dataset_event(self):
        """Test processing dataset events."""
        event = {
            "node_id": "node1",
            "dataset": "test_data",
            "size_bytes": "1024",
            "event": "after_dataset_loaded",
        }
        datasets = {}
        _process_dataset_event(event, datasets)

        assert "node1" in datasets
        assert datasets["node1"].name == "test_data"
        assert datasets["node1"].size_bytes == 1024

    def test_process_dataset_event_missing_id(self):
        """Test processing dataset event without node_id."""
        event = {"dataset": "test_data"}
        datasets = {}
        _process_dataset_event(event, datasets)
        assert len(datasets) == 0

    @patch("kedro_viz.api.rest.responses.run_events._hash_input_output")
    def test_process_dataset_error(self, mock_hash):
        """Test processing dataset error events."""
        mock_hash.return_value = "dataset_hash"
        event = {
            "node_id": "node1",
            "dataset": "test_dataset",
            "error": "Dataset error",
        }
        datasets = {}
        nodes = {"node1": NodeInfo()}
        pipeline_info = PipelineInfo()

        _process_dataset_error_event(event, datasets, nodes, pipeline_info)

        # Should use node_id as dataset_id when available (consistent with normal)
        assert "node1" in datasets
        assert datasets["node1"].status == DatasetStatus.MISSING
        assert nodes["node1"].status == NodeStatus.FAIL
        assert pipeline_info.status == PipelineStatus.FAILED

    def test_process_dataset_error_find_by_name(self):
        """Test finding node by name in dataset error."""
        event = {"node": "test_node", "error": "Error"}
        datasets = {}
        nodes = {"namespace.test_node": NodeInfo()}
        pipeline_info = PipelineInfo()

        _process_dataset_error_event(event, datasets, nodes, pipeline_info)

        assert nodes["namespace.test_node"].status == NodeStatus.FAIL

    def test_process_dataset_error_no_existing_error(self):
        """Test dataset error doesn't overwrite existing pipeline error."""
        event = {"error": "Dataset error"}
        datasets = {}
        nodes = {}
        pipeline_info = PipelineInfo(error="Existing error")

        _process_dataset_error_event(event, datasets, nodes, pipeline_info)

        assert pipeline_info.error == "Existing error"  # Should not overwrite

    @patch("kedro_viz.api.rest.responses.run_events._hash_input_output")
    def test_process_dataset_error_update_existing_dataset(self, mock_hash):
        """Test updating existing dataset with error info."""
        mock_hash.return_value = "dataset_hash"
        event = {"dataset": "test_dataset", "error": "Dataset error"}
        datasets = {
            "dataset_hash": DatasetInfo(name="existing", status=DatasetStatus.AVAILABLE)
        }
        nodes = {}
        pipeline_info = PipelineInfo()

        _process_dataset_error_event(event, datasets, nodes, pipeline_info)

        # Check that existing dataset was updated with error
        assert datasets["dataset_hash"].status == DatasetStatus.MISSING
        assert datasets["dataset_hash"].error.message == "Dataset error"

    @patch("kedro_viz.api.rest.responses.run_events.uuid.uuid4")
    @patch("kedro_viz.api.rest.responses.run_events.calculate_pipeline_duration")
    def test_finalize_pipeline_info(self, mock_calc_duration, mock_uuid):
        """Test finalizing pipeline information."""
        mock_uuid.return_value = "test-uuid"
        mock_calc_duration.return_value = 100.0

        pipeline_info = PipelineInfo()
        nodes = {"node1": NodeInfo(duration_sec=10.0)}
        _finalize_pipeline_info(pipeline_info, nodes)

        assert pipeline_info.run_id == "test-uuid"
        assert pipeline_info.total_duration_sec == 100.0

    @patch("kedro_viz.api.rest.responses.run_events._hash_input_output")
    def test_process_dataset_error_no_node_id(self, mock_hash):
        """Test processing dataset error events when node_id is not available."""
        mock_hash.return_value = "dataset_hash"
        event = {
            "dataset": "test_dataset",
            "error": "Dataset error"
            # No node_id provided
        }
        datasets = {}
        nodes = {}
        pipeline_info = PipelineInfo()

        _process_dataset_error_event(event, datasets, nodes, pipeline_info)

        # Should fallback to hashed dataset name when node_id not available
        assert "dataset_hash" in datasets
        assert datasets["dataset_hash"].status == DatasetStatus.MISSING
        assert pipeline_info.status == PipelineStatus.FAILED


class TestTransformEvents:
    """Test main event transformation function."""

    def test_transform_complete_pipeline(self):
        """Test transforming complete pipeline events."""
        events = [
            {"event": "before_pipeline_run", "timestamp": "2023-01-01T10:00:00"},
            {
                "event": "after_node_run",
                "node_id": "node1",
                "status": "Success",
                "duration_sec": 10.5,
            },
            {
                "event": "after_dataset_loaded",
                "node_id": "dataset1",
                "dataset": "test_data",
                "size_bytes": "1024",
            },
            {"event": "after_pipeline_run", "timestamp": "2023-01-01T10:15:00"},
        ]

        result = transform_events_to_structured_format(events)

        assert "node1" in result.nodes
        assert result.nodes["node1"].duration_sec == 10.5
        assert "dataset1" in result.datasets
        assert result.datasets["dataset1"].name == "test_data"
        assert result.pipeline.status == PipelineStatus.COMPLETED

    def test_transform_failed_pipeline(self):
        """Test transforming failed pipeline events."""
        events = [
            {"event": "on_node_error", "node_id": "node1", "error": "Failed"},
            {
                "event": "on_pipeline_error",
                "timestamp": "2023-01-01T10:05:00",
                "error": "Pipeline failed",
            },
        ]

        result = transform_events_to_structured_format(events)

        assert result.nodes["node1"].status == NodeStatus.FAIL
        assert result.pipeline.status == PipelineStatus.FAILED

    def test_transform_pipeline_error_with_dataset(self):
        """Test pipeline error with dataset information."""
        events = [
            {
                "event": "on_pipeline_error",
                "dataset": "test_dataset",
                "error": "Dataset error",
            }
        ]

        with patch(
            "kedro_viz.api.rest.responses.run_events._process_dataset_error_event"
        ) as mock_process:
            transform_events_to_structured_format(events)
            mock_process.assert_called_once()

    def test_transform_empty_events(self):
        """Test transforming empty events list."""
        result = transform_events_to_structured_format([])

        assert isinstance(result, StructuredRunEventAPIResponse)
        assert result.nodes == {}
        assert result.datasets == {}


class TestAPIResponse:
    """Test API response function."""

    @patch("kedro_viz.api.rest.responses.run_events._find_kedro_project")
    def test_no_kedro_project(self, mock_find_project):
        """Test when no Kedro project is found."""
        mock_find_project.return_value = None
        result = get_run_events_response()
        assert isinstance(result, StructuredRunEventAPIResponse)

    @patch("kedro_viz.api.rest.responses.run_events._find_kedro_project")
    @patch("pathlib.Path.exists")
    def test_file_not_found(self, mock_exists, mock_find_project):
        """Test when events file doesn't exist."""
        mock_find_project.return_value = Path("/test/project")
        mock_exists.return_value = False
        result = get_run_events_response()
        assert result.nodes == {}

    @patch("kedro_viz.api.rest.responses.run_events._find_kedro_project")
    @patch("pathlib.Path.exists")
    @patch("pathlib.Path.open")
    @patch("json.load")
    def test_successful_loading(
        self, mock_json_load, mock_file_open, mock_exists, mock_find_project
    ):
        """Test successful loading of run events."""
        mock_find_project.return_value = Path("/test/project")
        mock_exists.return_value = True
        mock_json_load.return_value = [
            {"event": "after_node_run", "node_id": "node1", "status": "Success"}
        ]
        mock_file_open.return_value.__enter__.return_value = mock.MagicMock()

        result = get_run_events_response()

        assert len(result.nodes) == 1
        assert "node1" in result.nodes

    @patch("kedro_viz.api.rest.responses.run_events._find_kedro_project")
    @patch("pathlib.Path.exists")
    @patch("pathlib.Path.open")
    @patch("json.load", side_effect=json.JSONDecodeError("Invalid JSON", "test", 0))
    def test_invalid_json(
        self, mock_json_load, mock_file_open, mock_exists, mock_find_project
    ):
        """Test handling invalid JSON."""
        mock_find_project.return_value = Path("/test/project")
        mock_exists.return_value = True
        mock_file_open.return_value.__enter__.return_value = mock.MagicMock()

        result = get_run_events_response()
        assert result.nodes == {}

    @patch("kedro_viz.api.rest.responses.run_events._find_kedro_project")
    @patch("pathlib.Path.exists")
    @patch("pathlib.Path.open", side_effect=OSError("File error"))
    def test_file_read_error(self, mock_file_open, mock_exists, mock_find_project):
        """Test handling file read errors."""
        mock_find_project.return_value = Path("/test/project")
        mock_exists.return_value = True

        result = get_run_events_response()
        assert result.nodes == {}

    @patch(
        "kedro_viz.api.rest.responses.run_events._find_kedro_project",
        side_effect=Exception("Unexpected"),
    )
    def test_general_exception(self, mock_find_project):
        """Test handling general exceptions."""
        result = get_run_events_response()
        assert result.nodes == {}


@pytest.fixture
def sample_events():
    """Sample events for integration testing."""
    return [
        {"event": "before_pipeline_run", "timestamp": "2023-01-01T10:00:00"},
        {
            "event": "after_node_run",
            "node_id": "node1",
            "status": "Success",
            "duration_sec": 10.5,
        },
        {"event": "on_node_error", "node_id": "node2", "error": "Node failed"},
        {
            "event": "after_dataset_loaded",
            "node_id": "dataset1",
            "dataset": "input_data",
            "size_bytes": "1024",
        },
        {"event": "after_pipeline_run", "timestamp": "2023-01-01T10:30:00"},
    ]


class TestIntegration:
    """Integration tests for complete workflow."""

    def test_complete_pipeline_run(self, sample_events):
        """Test processing a complete pipeline run."""
        result = transform_events_to_structured_format(sample_events)

        # Verify all components are processed
        assert len(result.nodes) == 2
        assert result.nodes["node1"].status == NodeStatus.SUCCESS
        assert result.nodes["node2"].status == NodeStatus.FAIL
        assert len(result.datasets) == 1
        assert result.datasets["dataset1"].name == "input_data"
        assert result.pipeline.status == PipelineStatus.COMPLETED

    @patch("kedro_viz.api.rest.responses.run_events._find_kedro_project")
    @patch("pathlib.Path.exists")
    @patch("pathlib.Path.open")
    @patch("json.load")
    def test_end_to_end_api_call(
        self,
        mock_json_load,
        mock_file_open,
        mock_exists,
        mock_find_project,
        sample_events,
    ):
        """Test end-to-end API call processing."""
        mock_find_project.return_value = Path("/test/project")
        mock_exists.return_value = True
        mock_json_load.return_value = sample_events
        mock_file_open.return_value.__enter__.return_value = mock.MagicMock()

        result = get_run_events_response()

        assert isinstance(result, StructuredRunEventAPIResponse)
        assert len(result.nodes) == 2
        assert len(result.datasets) == 1
