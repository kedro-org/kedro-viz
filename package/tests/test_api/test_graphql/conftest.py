# pylint: disable=import-outside-toplevel

import base64
import json
from pathlib import Path

import pytest

try:
    from kedro_datasets import pandas, tracking, matplotlib, plotly  # isort:skip
except ImportError:
    from kedro.extras.datasets import (  # Safe since ImportErrors are suppressed within kedro.
        pandas,
        tracking,
        matplotlib,
        plotly,
    )

from kedro.io import DataCatalog, Version

from kedro_viz.api.graphql.types import Run
from kedro_viz.database import create_db_engine
from kedro_viz.models.experiment_tracking import Base, RunModel, UserRunDetailsModel


@pytest.fixture
def example_run_ids():
    yield ["2021-11-03T18.24.24.379Z", "2021-11-02T18.24.24.379Z"]


@pytest.fixture
def example_db_session(tmp_path):
    session_store_location = Path(tmp_path / "session_store.db")
    engine, session_class = create_db_engine(session_store_location)
    Base.metadata.create_all(bind=engine)
    yield session_class


@pytest.fixture
def example_db_session_with_runs(example_db_session, example_run_ids):
    with example_db_session.begin() as session:
        for run_id in example_run_ids:
            session_data = {
                "package_name": "testsql",
                "project_path": "/Users/Projects/testsql",
                "session_id": run_id,
                "cli": {
                    "args": [],
                    "params": {
                        "from_inputs": [],
                        "to_outputs": [],
                        "from_nodes": [],
                        "to_nodes": [],
                        "node_names": (),
                        "runner": None,
                        "parallel": False,
                        "is_async": False,
                        "env": None,
                        "tag": (),
                        "load_version": {},
                        "pipeline": None,
                        "config": None,
                        "params": {},
                    },
                    "command_name": "run",
                    "command_path": "kedro run",
                },
            }
            run = RunModel(id=run_id, blob=json.dumps(session_data))
            user_run_details = UserRunDetailsModel(run_id=run.id, bookmark=True)
            session.add(run)
            session.add(user_run_details)
    yield example_db_session


@pytest.fixture
def data_access_manager_with_no_run(data_access_manager, example_db_session, mocker):
    data_access_manager.set_db_session(example_db_session)
    mocker.patch(
        "kedro_viz.api.graphql.schema.data_access_manager", data_access_manager
    )
    yield data_access_manager


@pytest.fixture
def data_access_manager_with_runs(
    data_access_manager, example_db_session_with_runs, mocker
):
    data_access_manager.set_db_session(example_db_session_with_runs)
    mocker.patch(
        "kedro_viz.api.graphql.schema.data_access_manager", data_access_manager
    )
    yield data_access_manager


@pytest.fixture
def save_version(example_run_ids):
    yield example_run_ids[0]


@pytest.fixture
def example_tracking_catalog(example_run_ids, tmp_path):
    example_run_id = example_run_ids[0]
    metrics_dataset = tracking.MetricsDataSet(
        filepath=Path(tmp_path / "test.json").as_posix(),
        version=Version(None, example_run_id),
    )
    metrics_dataset.save({"col1": 1, "col2": 2, "col3": 3})

    csv_dataset = pandas.CSVDataSet(
        Path(tmp_path / "metrics.csv").as_posix(),
        version=Version(None, example_run_id),
    )

    more_metrics = tracking.MetricsDataSet(
        filepath=Path(tmp_path / "metrics.json").as_posix(),
        version=Version(None, example_run_id),
    )
    more_metrics.save({"col4": 4, "col5": 5, "col6": 6})

    json_dataset = tracking.JSONDataSet(
        filepath=Path(tmp_path / "tracking.json").as_posix(),
        version=Version(None, example_run_id),
    )
    json_dataset.save({"col7": "column_seven", "col2": True, "col3": 3})

    plotly_dataset = plotly.JSONDataSet(
        filepath=Path(tmp_path / "plotly.json").as_posix(),
        version=Version(None, example_run_id),
    )

    class MockPlotlyData:
        data = {
            "data": [
                {
                    "x": ["giraffes", "orangutans", "monkeys"],
                    "y": [20, 14, 23],
                    "type": "bar",
                }
            ]
        }

        @classmethod
        def write_json(cls, fs_file, **kwargs):
            json.dump(cls.data, fs_file, **kwargs)

    plotly_dataset.save(MockPlotlyData)

    matplotlib_dataset = matplotlib.MatplotlibWriter(
        filepath=Path(tmp_path / "matplotlib.png").as_posix(),
        version=Version(None, example_run_id),
    )

    class MockMatplotData:
        data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUg"
            "AAAAEAAAABCAQAAAC1HAwCAA"
            "AAC0lEQVQYV2NgYAAAAAM"
            "AAWgmWQ0AAAAASUVORK5CYII="
        )

        @classmethod
        def savefig(cls, bytes_buffer, **kwargs):
            bytes_buffer.write(cls.data)

    matplotlib_dataset.save(MockMatplotData)

    catalog = DataCatalog(
        data_sets={
            "metrics": metrics_dataset,
            "csv_dataset": csv_dataset,
            "more_metrics": more_metrics,
            "json_tracking": json_dataset,
            "plotly_dataset": plotly_dataset,
            "matplotlib_dataset": matplotlib_dataset,
        }
    )

    yield catalog


@pytest.fixture
def example_multiple_run_tracking_catalog(example_run_ids, tmp_path):
    new_metrics_dataset = tracking.MetricsDataSet(
        filepath=Path(tmp_path / "test.json").as_posix(),
        version=Version(None, example_run_ids[1]),
    )
    new_metrics_dataset.save({"col1": 1, "col3": 3})
    new_metrics_dataset = tracking.MetricsDataSet(
        filepath=Path(tmp_path / "test.json").as_posix(),
        version=Version(None, example_run_ids[0]),
    )
    new_data = {"col1": 3, "col2": 3.23}
    new_metrics_dataset.save(new_data)
    catalog = DataCatalog(
        data_sets={
            "new_metrics": new_metrics_dataset,
        }
    )

    yield catalog


@pytest.fixture
def example_multiple_run_tracking_catalog_at_least_one_empty_run(
    example_run_ids, tmp_path
):
    new_metrics_dataset = tracking.MetricsDataSet(
        filepath=Path(tmp_path / "test.json").as_posix(),
        version=Version(None, example_run_ids[1]),
    )
    new_metrics_dataset.save({"col1": 1, "col3": 3})
    new_metrics_dataset = tracking.MetricsDataSet(
        filepath=Path(tmp_path / "test.json").as_posix(),
        version=Version(None, example_run_ids[0]),
    )
    catalog = DataCatalog(
        data_sets={
            "new_metrics": new_metrics_dataset,
        }
    )

    yield catalog


@pytest.fixture
def example_multiple_run_tracking_catalog_all_empty_runs(example_run_ids, tmp_path):
    new_metrics_dataset = tracking.MetricsDataSet(
        filepath=Path(tmp_path / "test.json").as_posix(),
        version=Version(None, example_run_ids[1]),
    )
    new_metrics_dataset = tracking.MetricsDataSet(
        filepath=Path(tmp_path / "test.json").as_posix(),
        version=Version(None, example_run_ids[0]),
    )
    catalog = DataCatalog(
        data_sets={
            "new_metrics": new_metrics_dataset,
        }
    )

    yield catalog


@pytest.fixture
def example_runs(example_run_ids):
    yield [
        Run(
            id=run_id,
            bookmark=False,
            notes="Hello World",
            title="Hello Kedro",
            author="",
            git_branch="",
            git_sha="",
            run_command="",
        )
        for run_id in example_run_ids
    ]
