"""Tests for kedro data loader functions."""

import json
import logging
from unittest.mock import patch

import pytest

from kedro_viz.constants import VIZ_METADATA_ARGS
from kedro_viz.integrations.kedro.data_loader import (
    _create_node_extras_mapping,
    _get_dataset_stats,
    _get_node_styles,
)


@pytest.fixture
def mock_project_path(tmp_path):
    """Create a temporary project directory structure."""
    project_path = tmp_path / "test_project"
    project_path.mkdir()

    # Create metadata directory
    metadata_dir = project_path / VIZ_METADATA_ARGS["path"]
    metadata_dir.mkdir(parents=True)

    return project_path


@pytest.fixture
def valid_stats_data():
    """Sample valid stats data."""
    return {
        "node1": {"rows": 100, "columns": 5, "file_size": 1024},
        "node2": {"rows": 200, "columns": 8, "file_size": 2048},
    }


@pytest.fixture
def valid_styles_data():
    """Sample valid styles data."""
    return {
        "node1": {
            "color": "blue",
            "themes": {"dark": {"fill": "red"}, "light": {"fill": "green"}},
        },
        "node2": {
            "color": "red",
            "themes": {"dark": {"fill": "orange"}, "light": {"fill": "yellow"}},
        },
    }


class TestGetDatasetStats:
    """Test cases for _get_dataset_stats function."""

    def test_get_dataset_stats_valid_json(self, mock_project_path, valid_stats_data):
        """Test _get_dataset_stats with valid JSON content."""
        stats_file = mock_project_path / VIZ_METADATA_ARGS["path"] / "stats.json"
        stats_file.write_text(json.dumps(valid_stats_data))

        result = _get_dataset_stats(mock_project_path)
        assert result == valid_stats_data

    def test_get_dataset_stats_missing_file(self, mock_project_path):
        """Test _get_dataset_stats when stats.json doesn't exist."""
        result = _get_dataset_stats(mock_project_path)
        assert result == {}

    def test_get_dataset_stats_empty_file(self, mock_project_path, caplog):
        """Test _get_dataset_stats with empty stats.json file."""
        stats_file = mock_project_path / VIZ_METADATA_ARGS["path"] / "stats.json"
        stats_file.write_text("")

        with caplog.at_level(logging.WARNING):
            result = _get_dataset_stats(mock_project_path)

        assert result == {}
        assert "Invalid JSON format in stats.json" in caplog.text
        assert "Please check your stats.json file for syntax errors" in caplog.text

    def test_get_dataset_stats_invalid_json(self, mock_project_path, caplog):
        """Test _get_dataset_stats with invalid JSON syntax."""
        stats_file = mock_project_path / VIZ_METADATA_ARGS["path"] / "stats.json"
        stats_file.write_text('{"node1": {"rows": 100, "invalid":')

        with caplog.at_level(logging.WARNING):
            result = _get_dataset_stats(mock_project_path)

        assert result == {}
        assert "Invalid JSON format in stats.json" in caplog.text

    def test_get_dataset_stats_permission_error(self, mock_project_path, caplog):
        """Test _get_dataset_stats when file permissions deny access."""
        stats_file = mock_project_path / VIZ_METADATA_ARGS["path"] / "stats.json"
        stats_file.write_text(json.dumps({"node1": {"rows": 100}}))

        with patch("builtins.open", side_effect=PermissionError("Access denied")):
            with caplog.at_level(logging.WARNING):
                result = _get_dataset_stats(mock_project_path)

            assert result == {}
            assert "Permission denied accessing stats.json" in caplog.text
            assert "Please check file permissions" in caplog.text

    def test_get_dataset_stats_encoding_error(self, mock_project_path, caplog):
        """Test _get_dataset_stats with encoding issues."""
        stats_file = mock_project_path / VIZ_METADATA_ARGS["path"] / "stats.json"
        stats_file.write_bytes(b'\xff\xfe{"node1": {"rows": 100}}')

        with caplog.at_level(logging.WARNING):
            result = _get_dataset_stats(mock_project_path)

        assert result == {}
        assert "Issue in reading stats.json" in caplog.text
        assert "invalid start byte" in caplog.text

    @pytest.mark.parametrize(
        "invalid_json,test_name,expected_error",
        [
            (
                '{"node": invalid}',
                "missing quotes",
                "Invalid JSON format in stats.json",
            ),
            (
                '[{"node": "value"}]',
                "array instead of object",
                "Invalid data format in stats.json",
            ),
            ("null", "null instead of object", "Invalid data format in stats.json"),
            (
                '"string"',
                "string instead of object",
                "Invalid data format in stats.json",
            ),
            ("123", "number instead of object", "Invalid data format in stats.json"),
            (
                '{"node1": {"color": "blue",}}',
                "trailing comma",
                "Invalid JSON format in stats.json",
            ),
        ],
    )
    def test_get_dataset_stats_various_invalid_formats(
        self, mock_project_path, caplog, invalid_json, test_name, expected_error
    ):
        """Test various invalid JSON formats and data types."""
        stats_file = mock_project_path / VIZ_METADATA_ARGS["path"] / "stats.json"
        stats_file.write_text(invalid_json)

        with caplog.at_level(logging.WARNING):
            result = _get_dataset_stats(mock_project_path)

        assert result == {}
        assert expected_error in caplog.text


class TestGetNodeStyles:
    """Test cases for _get_node_styles function."""

    def test_get_node_styles_valid_json(self, mock_project_path, valid_styles_data):
        """Test _get_node_styles with valid JSON content."""
        styles_file = mock_project_path / VIZ_METADATA_ARGS["path"] / "styles.json"
        styles_file.write_text(json.dumps(valid_styles_data))

        result = _get_node_styles(mock_project_path)
        assert result == valid_styles_data

    def test_get_node_styles_missing_file(self, mock_project_path):
        """Test _get_node_styles when styles.json doesn't exist."""
        result = _get_node_styles(mock_project_path)
        assert result == {}

    def test_get_node_styles_empty_file(self, mock_project_path, caplog):
        """Test _get_node_styles with empty styles.json file."""
        styles_file = mock_project_path / VIZ_METADATA_ARGS["path"] / "styles.json"
        styles_file.write_text("")

        with caplog.at_level(logging.WARNING):
            result = _get_node_styles(mock_project_path)

        assert result == {}
        assert "Invalid JSON format in styles.json" in caplog.text
        assert "Please check your styles.json file for syntax errors" in caplog.text


class TestCreateNodeExtrasMapping:
    """Test cases for _create_node_extras_mapping function."""

    def test_create_node_extras_mapping_empty_directory(self, mock_project_path):
        """Test _create_node_extras_mapping when no stats/styles files exist."""
        result = _create_node_extras_mapping(mock_project_path)
        assert result == {}

    def test_create_node_extras_mapping_with_stats_only(
        self, mock_project_path, valid_stats_data
    ):
        """Test _create_node_extras_mapping with only stats data."""
        stats_file = mock_project_path / VIZ_METADATA_ARGS["path"] / "stats.json"
        stats_file.write_text(json.dumps(valid_stats_data))

        result = _create_node_extras_mapping(mock_project_path)

        assert len(result) == 2
        assert "node1" in result
        assert "node2" in result
        assert result["node1"].stats == valid_stats_data["node1"]
        assert result["node1"].styles is None

    def test_create_node_extras_mapping_with_styles_only(
        self, mock_project_path, valid_styles_data
    ):
        """Test _create_node_extras_mapping with only styles data."""
        styles_file = mock_project_path / VIZ_METADATA_ARGS["path"] / "styles.json"
        styles_file.write_text(json.dumps(valid_styles_data))

        result = _create_node_extras_mapping(mock_project_path)

        assert len(result) == 2
        assert "node1" in result
        assert "node2" in result
        assert result["node1"].styles == valid_styles_data["node1"]
        assert result["node1"].stats is None

    def test_create_node_extras_mapping_with_both_stats_and_styles(
        self, mock_project_path, valid_stats_data, valid_styles_data
    ):
        """Test _create_node_extras_mapping with both stats and styles."""
        stats_file = mock_project_path / VIZ_METADATA_ARGS["path"] / "stats.json"
        stats_file.write_text(json.dumps(valid_stats_data))

        styles_file = mock_project_path / VIZ_METADATA_ARGS["path"] / "styles.json"
        styles_file.write_text(json.dumps(valid_styles_data))

        result = _create_node_extras_mapping(mock_project_path)

        assert len(result) == 2
        assert "node1" in result
        assert "node2" in result
        assert result["node1"].stats == valid_stats_data["node1"]
        assert result["node1"].styles == valid_styles_data["node1"]

    def test_create_node_extras_mapping_with_different_nodes_in_files(
        self, mock_project_path
    ):
        """Test _create_node_extras_mapping when stats and styles have different nodes."""
        stats_data = {"node1": {"rows": 100, "columns": 5}}
        styles_data = {"node2": {"color": "blue"}}

        stats_file = mock_project_path / VIZ_METADATA_ARGS["path"] / "stats.json"
        stats_file.write_text(json.dumps(stats_data))

        styles_file = mock_project_path / VIZ_METADATA_ARGS["path"] / "styles.json"
        styles_file.write_text(json.dumps(styles_data))

        result = _create_node_extras_mapping(mock_project_path)

        assert len(result) == 2
        assert "node1" in result
        assert "node2" in result
        assert result["node1"].stats == stats_data["node1"]
        assert result["node1"].styles is None
        assert result["node2"].stats is None
        assert result["node2"].styles == styles_data["node2"]

    def test_create_node_extras_mapping_with_invalid_stats(
        self, mock_project_path, valid_styles_data, caplog
    ):
        """Test _create_node_extras_mapping when stats.json is invalid."""
        stats_file = mock_project_path / VIZ_METADATA_ARGS["path"] / "stats.json"
        stats_file.write_text('{"invalid": json}')

        styles_file = mock_project_path / VIZ_METADATA_ARGS["path"] / "styles.json"
        styles_file.write_text(json.dumps(valid_styles_data))

        with caplog.at_level(logging.WARNING):
            result = _create_node_extras_mapping(mock_project_path)

        # Should still work with styles only
        assert len(result) == 2
        assert all(node.stats is None for node in result.values())
        assert all(node.styles is not None for node in result.values())

    def test_create_node_extras_mapping_with_invalid_styles(
        self, mock_project_path, valid_stats_data, caplog
    ):
        """Test _create_node_extras_mapping when styles.json is invalid."""
        stats_file = mock_project_path / VIZ_METADATA_ARGS["path"] / "stats.json"
        stats_file.write_text(json.dumps(valid_stats_data))

        styles_file = mock_project_path / VIZ_METADATA_ARGS["path"] / "styles.json"
        styles_file.write_text('{"invalid": json}')

        with caplog.at_level(logging.WARNING):
            result = _create_node_extras_mapping(mock_project_path)

        # Should still work with stats only
        assert len(result) == 2
        assert all(node.stats is not None for node in result.values())
        assert all(node.styles is None for node in result.values())

    def test_create_node_extras_mapping_matches_example_fixture(
        self, mock_project_path, example_node_extras_dict
    ):
        """Test that _create_node_extras_mapping works with fixture-like data."""
        # Extract data from the fixture to create files
        stats_data = {}
        styles_data = {}

        for node_name, node_extras in example_node_extras_dict.items():
            if node_extras.stats:
                stats_data[node_name] = node_extras.stats
            if node_extras.styles:
                styles_data[node_name] = node_extras.styles

        if stats_data:
            stats_file = mock_project_path / VIZ_METADATA_ARGS["path"] / "stats.json"
            stats_file.write_text(json.dumps(stats_data))

        if styles_data:
            styles_file = mock_project_path / VIZ_METADATA_ARGS["path"] / "styles.json"
            styles_file.write_text(json.dumps(styles_data))

        result = _create_node_extras_mapping(mock_project_path)

        # Verify we get the same nodes as in the fixture
        assert set(result.keys()) == set(example_node_extras_dict.keys())

        # Verify the data matches
        for node_name in result.keys():
            if node_name in stats_data:
                assert result[node_name].stats == stats_data[node_name]
            if node_name in styles_data:
                assert result[node_name].styles == styles_data[node_name]
