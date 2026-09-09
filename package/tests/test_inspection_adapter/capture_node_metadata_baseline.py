"""Capture complete metadata responses using the pinned, pre-helper legacy backend.

Run from the repository root with the backend test dependencies installed:

    python package/tests/test_inspection_adapter/capture_node_metadata_baseline.py

The script archives the exact source commit, builds isolated deterministic demo data,
and loads that backend in a fresh process. It never uses current metadata production
code to calculate expectations. Dependency versions are recorded for reproducibility.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import subprocess
import sys
import tempfile
import zipfile
from importlib.metadata import version
from pathlib import Path

NODE_METADATA_BASELINE_SOURCE_COMMIT = "7d33f246d424418f0c143409db28014ca358008e"
OUT_PATH = Path(__file__).resolve().parent / "baseline/node_metadata.json"


def normalize_node_metadata(response: dict) -> dict:
    """Normalize project paths and hash entire preview payloads, without dropping fields."""
    response = json.loads(json.dumps(response))
    filepath = response.get("filepath")
    if isinstance(filepath, str) and "demo-project/" in filepath:
        _, relative_path = filepath.split("demo-project/", maxsplit=1)
        response["filepath"] = f"<DEMO_PROJECT>/{relative_path}"
    if "preview" in response:
        preview_json = json.dumps(
            response["preview"],
            ensure_ascii=False,
            separators=(",", ":"),
            sort_keys=True,
        )
        response["preview"] = {
            "sha256": hashlib.sha256(preview_json.encode()).hexdigest()
        }
    return response


def _capture(legacy_root: Path, output: Path) -> None:
    # This worker starts without any current kedro_viz modules imported.
    legacy_root = legacy_root.resolve()
    sys.path.insert(0, str(legacy_root / "package"))
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from metadata_parity_project import prepare_metadata_parity_project

    import kedro_viz
    from kedro_viz.api.rest.responses.nodes import (
        NodeMetadataAPIResponse,
        get_node_metadata_response,
    )
    from kedro_viz.data_access import data_access_manager
    from kedro_viz.server import load_and_populate_data

    assert Path(kedro_viz.__file__).resolve().is_relative_to(legacy_root)
    project = prepare_metadata_parity_project(
        legacy_root / "demo-project", legacy_root / "fixture/demo-project"
    )
    load_and_populate_data(project)
    app = FastAPI()

    @app.get(
        "/api/nodes/{node_id}",
        response_model=NodeMetadataAPIResponse,
        response_model_exclude_none=True,
    )
    async def get_node_metadata(node_id: str):
        return get_node_metadata_response(node_id)

    responses = {}
    with TestClient(app) as client:
        for node_id in data_access_manager.nodes.get_node_ids():
            node = data_access_manager.nodes.get_node_by_id(node_id)
            if node is not None and node.has_metadata():
                response = client.get(f"/api/nodes/{node_id}")
                response.raise_for_status()
                responses[node_id] = normalize_node_metadata(response.json())
    report = {
        "captured_from_commit": NODE_METADATA_BASELINE_SOURCE_COMMIT,
        "dependencies": {
            name: version(name)
            for name in (
                "kedro",
                "kedro-datasets",
                "pandas",
                "pydantic",
                "fastapi",
                "plotly",
            )
        },
        "responses": responses,
    }
    output.write_text(
        json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    print(f"Captured {len(responses)} legacy responses to {output}")


def main() -> None:
    """Archive pinned production sources and run capture in an isolated worker."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=OUT_PATH)
    parser.add_argument("--legacy-root", type=Path, help=argparse.SUPPRESS)
    args = parser.parse_args()
    if args.legacy_root is not None:
        _capture(args.legacy_root, args.output.resolve())
        return
    archive = subprocess.run(
        [
            "git",
            "archive",
            "--format=zip",
            NODE_METADATA_BASELINE_SOURCE_COMMIT,
            "package/kedro_viz",
            "demo-project",
        ],
        cwd=Path(__file__).resolve().parents[3],
        capture_output=True,
        check=True,
    )
    with tempfile.TemporaryDirectory(prefix="kedro-viz-legacy-metadata-") as directory:
        with zipfile.ZipFile(io.BytesIO(archive.stdout)) as source:
            source.extractall(directory)
        subprocess.run(
            [
                sys.executable,
                str(Path(__file__).resolve()),
                "--legacy-root",
                directory,
                "--output",
                str(args.output.resolve()),
            ],
            cwd=directory,
            check=True,
        )


if __name__ == "__main__":
    main()
