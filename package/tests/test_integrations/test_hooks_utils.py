from __future__ import annotations

import json
from datetime import datetime, timezone

import pytest
from kedro.pipeline import node
from kedro.pipeline.node import Node as KedroNode

from kedro_viz.integrations.kedro.hooks_utils import (
    compute_size,
    extract_file_paths,
    generate_timestamp,
    get_file_size,
    hash_node,
    is_default_run,
    is_sequential_runner,
    write_events,
    write_events_to_file,
)


@pytest.fixture
def sample_node() -> KedroNode:
    return node(lambda x: x, inputs="a", outputs="b", name="sample")


class TestHashing:
    def test_hash_node_is_stable_and_unique(self, sample_node):
        a = hash_node(sample_node)
        b = hash_node(sample_node)
        assert a == b
        assert a != hash_node("different")


class TestFilePathExtraction:
    def test_extract_file_paths_variants(self):
        class Multi:
            filepaths = ["a.txt", "b.txt"]

        class Single:
            filepath = "single.txt"

        assert extract_file_paths(Multi()) == []
        assert extract_file_paths(Single()) == ["single.txt"]


class TestFileSizeUtils:
    def test_get_file_size_for_existing_file(self, tmp_path):
        filepath = tmp_path / "file.txt"
        filepath.write_text("abcdef")
        assert get_file_size(str(filepath)) == 6

    def test_get_file_size_for_missing_file(self, tmp_path):
        assert get_file_size(str(tmp_path / "no.txt")) is None

    def test_compute_size_for_valid_dataset(self, tmp_path):
        filepath = tmp_path / "file.txt"
        filepath.write_text("abcdef")
        datasets = {"mock_dataset": type("Local", (), {"filepath": str(filepath)})()}
        assert compute_size("mock_dataset", datasets) == 6

    def test_compute_size_returns_none_for_missing_dataset(self):
        assert compute_size("missing", {}) == 0

    def test_compute_size_returns_none_when_no_filepath_attr(self):
        class NoPath:
            pass

        assert compute_size("ds", {"ds": NoPath()}) == 0


class TestTimestampUtils:
    def test_generate_timestamp_format(self):
        ts = generate_timestamp()
        parsed_ts = datetime.fromisoformat(ts)

        # Should have timezone info, and it should be UTC
        assert parsed_ts.tzinfo is not None, (
            "Parsed timestamp should have timezone info"
        )
        assert parsed_ts.tzinfo.utcoffset(parsed_ts) == timezone.utc.utcoffset(
            parsed_ts
        ), f"Timestamp timezone offset is not UTC, got: {parsed_ts.tzinfo}"

        # Should be close to current UTC time
        now = datetime.now(timezone.utc)
        delta = abs((parsed_ts - now).total_seconds())
        assert delta < 5, (
            f"Timestamp is not within 5 seconds of current UTC time, delta={delta}, ts={ts}, now={now}"
        )


class TestWriteEvents:
    def test_write_events_invokes_write_events_to_file(self, monkeypatch, tmp_path):
        events = [{"event": "x"}]

        monkeypatch.setattr(
            "kedro_viz.integrations.kedro.hooks_utils._find_kedro_project",
            lambda _: tmp_path,
        )

        captured = {}

        def mock_write_events_to_file(project, events_dir, events_file, events_json):
            captured["project"] = project
            captured["json"] = json.loads(events_json)

        monkeypatch.setattr(
            "kedro_viz.integrations.kedro.hooks_utils.write_events_to_file",
            mock_write_events_to_file,
        )

        write_events(events)

        assert captured["project"] == tmp_path
        assert captured["json"] == events

    def test_write_events_skips_if_no_project(self, monkeypatch, caplog):
        monkeypatch.setattr(
            "kedro_viz.integrations.kedro.hooks_utils._find_kedro_project",
            lambda _: None,
        )
        write_events([{"event": "x"}])
        assert "No Kedro project found" in caplog.text

    def test_write_events_to_file_outputs_json(self, tmp_path):
        content = '[{"event": "x"}]'
        write_events_to_file(tmp_path, ".viz", "events.json", content)
        out = tmp_path / ".viz" / "events.json"
        assert json.loads(out.read_text()) == [{"event": "x"}]


class TestRunDefaults:
    @pytest.mark.parametrize(
        "params, expected",
        [({}, True), ({"pipeline_name": "etl"}, False), ({"tags": ["a"]}, False)],
    )
    def test_is_default_run(self, params, expected):
        assert is_default_run(params) is expected

    @pytest.mark.parametrize(
        "params, expected",
        [
            ({}, True),
            ({"runner": None}, True),
            ({"runner": "SequentialRunner"}, True),
            ({"runner": "kedro.runner.SequentialRunner"}, True),
            ({"runner": "ParallelRunner"}, False),
            ({"runner": "ThreadRunner"}, False),
            ({"runner": 123}, False),
            ({"runner": []}, False),
        ],
    )
    def test_is_sequential_runner(self, params, expected):
        assert is_sequential_runner(params) is expected
