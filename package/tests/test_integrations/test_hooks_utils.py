from __future__ import annotations

import json
from datetime import datetime

import pytest
from kedro.pipeline import node
from kedro.pipeline.node import Node as KedroNode

from kedro_viz.integrations.kedro.hooks_utils import (
    TIME_FORMAT,
    compute_size,
    create_dataset_event,
    extract_file_paths,
    generate_timestamp,
    get_file_size,
    hash_node,
    is_default_run,
    write_events,
    write_events_to_file,
)

# -----------------------------------------------------------------------------
# Fixtures & helpers
# -----------------------------------------------------------------------------


@pytest.fixture
def sample_node() -> KedroNode:
    return node(lambda x: x, inputs="a", outputs="b", name="sample")


class DummyDataset:
    filepath = "data/file.txt"


# -----------------------------------------------------------------------------
# Hashing helpers
# -----------------------------------------------------------------------------


def test_hash_node_stable_and_unique(sample_node):
    a = hash_node(sample_node)
    b = hash_node(sample_node)
    assert a == b
    assert a != hash_node("different")


# -----------------------------------------------------------------------------
# extract_file_paths + compute_size + get_file_size
# -----------------------------------------------------------------------------


def test_extract_file_paths_variants():
    class Multi:
        filepaths = ["a.txt", "b.txt"]

    class Single:
        filepath = "single.txt"

    assert extract_file_paths(Multi()) == []
    assert extract_file_paths(Single()) == ["single.txt"]


def test_compute_size_and_get_file_size(tmp_path):
    fp = tmp_path / "file.txt"
    fp.write_text("abcdef")  # 6 bytes

    assert get_file_size(str(fp)) == 6

    datasets = {"ds": type("Local", (), {"filepath": str(fp)})()}
    assert compute_size("ds", datasets) == 6


def test_compute_size_fallbacks():
    assert compute_size("missing", {}) is None

    class NoPath:
        pass

    assert compute_size("ds", {"ds": NoPath()}) is None


def test_get_file_size_nonexistent(tmp_path):
    assert get_file_size(str(tmp_path / "no.txt")) is None


# -----------------------------------------------------------------------------
# create_dataset_event
# -----------------------------------------------------------------------------


def test_create_dataset_event_includes_size(tmp_path):
    fp = tmp_path / "d.txt"
    fp.write_text("abc")

    datasets = {"d": type("Local", (), {"filepath": str(fp)})()}
    evt = create_dataset_event("after_dataset_saved", "d", "value", datasets)

    assert evt["event"] == "after_dataset_saved"
    assert evt["dataset"] == "d"
    assert evt["size"] == 3


# -----------------------------------------------------------------------------
# generate_timestamp()
# -----------------------------------------------------------------------------


def test_generate_timestamp_format():
    ts = generate_timestamp()
    assert ts.endswith("Z")
    datetime.strptime(ts, TIME_FORMAT)  # parse without error


# -----------------------------------------------------------------------------
# write_events wrappers
# -----------------------------------------------------------------------------


def test_write_events_invokes_impl(monkeypatch, tmp_path):
    events = [{"event": "x"}]

    monkeypatch.setattr(
        "kedro_viz.integrations.kedro.hooks_utils._find_kedro_project",
        lambda _: tmp_path,
    )

    captured = {}

    def _fake(project, events_dir, events_file, events_json):
        captured["project"] = project
        captured["json"] = json.loads(events_json)

    monkeypatch.setattr(
        "kedro_viz.integrations.kedro.hooks_utils.write_events_to_file", _fake
    )

    write_events(events)
    assert captured["project"] == tmp_path
    assert captured["json"] == events


def test_write_events_skips_when_no_project(monkeypatch, caplog):
    monkeypatch.setattr(
        "kedro_viz.integrations.kedro.hooks_utils._find_kedro_project",
        lambda _: None,
    )
    write_events([{"event": "x"}])
    assert "No Kedro project found" in caplog.text


# -----------------------------------------------------------------------------
# write_events_to_file integration
# -----------------------------------------------------------------------------


def test_write_events_to_file(tmp_path):
    content = '[{"event": "x"}]'
    write_events_to_file(tmp_path, ".viz", "events.json", content)
    out = tmp_path / ".viz" / "events.json"
    assert json.loads(out.read_text()) == [{"event": "x"}]


# -----------------------------------------------------------------------------
# is_default_run()
# -----------------------------------------------------------------------------


@pytest.mark.parametrize(
    "params, expected",
    [({}, True), ({"pipeline_name": "etl"}, False), ({"tags": ["a"]}, False)],
)
def test_is_default_run(params, expected):
    assert is_default_run(params) is expected
