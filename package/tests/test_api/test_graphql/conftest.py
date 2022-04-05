import json
import shutil
from pathlib import Path

import pytest
from kedro.extras.datasets.pandas import CSVDataSet
from kedro.extras.datasets.tracking import JSONDataSet, MetricsDataSet
from kedro.io import DataCatalog, Version

from kedro_viz.api.graphql import Run
from kedro_viz.database import create_db_engine
from kedro_viz.models.experiments_tracking import Base, RunModel, UserRunDetailsModel


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
    mocker.patch("kedro_viz.api.graphql.data_access_manager", data_access_manager)
    yield data_access_manager


@pytest.fixture
def data_access_manager_with_runs(
    data_access_manager, example_db_session_with_runs, mocker
):
    data_access_manager.set_db_session(example_db_session_with_runs)
    mocker.patch("kedro_viz.api.graphql.data_access_manager", data_access_manager)
    yield data_access_manager


@pytest.fixture
def save_version(example_run_ids):
    yield example_run_ids[0]


@pytest.fixture
def example_tracking_catalog(example_run_ids):
    # Note - filepath is assigned without using tmp_path as it fails on windows build.
    # This is a temp soln and will be cleaned up in the future.
    example_run_id = example_run_ids[0]
    metrics_dataset = MetricsDataSet(
        filepath="test.json",
        version=Version(None, example_run_id),
    )
    metrics_dataset.save({"col1": 1, "col2": 2, "col3": 3})

    dataset = CSVDataSet(filepath="dataset.csv")

    more_metrics = MetricsDataSet(
        filepath="metrics.json",
        version=Version(None, example_run_id),
    )
    more_metrics.save({"col4": 4, "col5": 5, "col6": 6})

    json_dataset = JSONDataSet(
        filepath="tracking.json",
        version=Version(None, example_run_id),
    )
    json_dataset.save({"col7": "column_seven", "col2": True, "col3": 3})

    catalog = DataCatalog(
        data_sets={
            "metrics": metrics_dataset,
            "csv": dataset,
            "more_metrics": more_metrics,
            "json_tracking": json_dataset,
        }
    )

    yield catalog

    shutil.rmtree("test.json", ignore_errors=True)
    shutil.rmtree("metrics.json", ignore_errors=True)
    shutil.rmtree("tracking.json", ignore_errors=True)


@pytest.fixture
def example_multiple_run_tracking_catalog(example_run_ids):
    # Note - filepath is assigned without using tmp_path as it fails on windows build.
    # This is a temp soln and will be cleaned up in the future.
    new_metrics_dataset = MetricsDataSet(
        filepath="test.json",
        version=Version(None, example_run_ids[1]),
    )
    new_metrics_dataset.save({"col1": 1, "col3": 3})
    new_metrics_dataset = MetricsDataSet(
        filepath="test.json",
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

    shutil.rmtree("test.json", ignore_errors=True)


@pytest.fixture
def example_multiple_run_tracking_catalog_at_least_one_empty_run(example_run_ids):
    # Note - filepath is assigned without using tmp_path as it fails on windows build.
    # This is a temp soln and will be cleaned up in the future.
    new_metrics_dataset = MetricsDataSet(
        filepath="test.json",
        version=Version(None, example_run_ids[1]),
    )
    new_metrics_dataset.save({"col1": 1, "col3": 3})
    new_metrics_dataset = MetricsDataSet(
        filepath="test.json",
        version=Version(None, example_run_ids[0]),
    )
    catalog = DataCatalog(
        data_sets={
            "new_metrics": new_metrics_dataset,
        }
    )

    yield catalog

    shutil.rmtree("test.json", ignore_errors=True)


@pytest.fixture
def example_multiple_run_tracking_catalog_all_empty_runs(example_run_ids):
    # Note - filepath is assigned without using tmp_path as it fails on windows build.
    # This is a temp soln and will be cleaned up in the future.
    new_metrics_dataset = MetricsDataSet(
        filepath="test.json",
        version=Version(None, example_run_ids[1]),
    )
    new_metrics_dataset = MetricsDataSet(
        filepath="test.json",
        version=Version(None, example_run_ids[0]),
    )
    catalog = DataCatalog(
        data_sets={
            "new_metrics": new_metrics_dataset,
        }
    )

    yield catalog

    shutil.rmtree("test.json", ignore_errors=True)


@pytest.fixture
def example_runs(example_run_ids):
    yield [
        Run(
            id=run_id,
            bookmark=False,
            notes="Hello World",
            title="Hello Kedro",
            author="",
            gitBranch="",
            gitSha="",
            runCommand="",
        )
        for run_id in example_run_ids
    ]
