import json

import pytest
from pydantic import BaseModel

from kedro_viz.server import run_server


class ExampleAPIResponse(BaseModel):
    content: str


@pytest.fixture(autouse=True)
def patched_uvicorn_run(mocker):
    yield mocker.patch("uvicorn.run")


@pytest.fixture(autouse=True)
def patched_data_access_manager(mocker):
    yield mocker.patch("kedro_viz.server.data_access_manager")


@pytest.fixture(autouse=True)
def patched_create_api_app_from_project(mocker):
    yield mocker.patch("kedro_viz.api.apps.create_api_app_from_project")


@pytest.fixture
def patched_create_api_app_from_file(mocker):
    yield mocker.patch("kedro_viz.api.apps.create_api_app_from_file")


@pytest.fixture(autouse=True)
def patched_load_data(
    mocker, example_catalog, example_pipelines, session_store, example_stats_dict
):
    yield mocker.patch(
        "kedro_viz.server.kedro_data_loader.load_data",
        return_value=(
            example_catalog,
            example_pipelines,
            session_store,
            example_stats_dict,
        ),
    )


@pytest.fixture
def patched_load_data_with_sqlite_session_store(
    mocker, example_catalog, example_pipelines, sqlite_session_store, example_stats_dict
):
    yield mocker.patch(
        "kedro_viz.server.kedro_data_loader.load_data",
        return_value=(
            example_catalog,
            example_pipelines,
            sqlite_session_store,
            example_stats_dict,
        ),
    )


class TestServer:
    def test_run_server_from_project(
        self,
        patched_create_api_app_from_project,
        patched_data_access_manager,
        patched_uvicorn_run,
        example_catalog,
        example_pipelines,
    ):
        run_server()
        # assert that when running server, data are added correctly to the data access manager
        patched_data_access_manager.add_catalog.assert_called_once_with(example_catalog)
        patched_data_access_manager.add_pipelines.assert_called_once_with(
            example_pipelines
        )
        patched_data_access_manager.set_db_session.assert_not_called()

        # correct api app is created
        patched_create_api_app_from_project.assert_called_once()

        # an uvicorn server is launched
        patched_uvicorn_run.assert_called_once()

    def test_run_server_from_project_with_sqlite_store(
        self,
        patched_create_api_app_from_project,
        patched_data_access_manager,
        patched_uvicorn_run,
        patched_load_data_with_sqlite_session_store,
        example_catalog,
        example_pipelines,
    ):
        run_server()
        # assert that when running server, data are added correctly to the data access manager
        patched_data_access_manager.add_catalog.assert_called_once_with(example_catalog)
        patched_data_access_manager.add_pipelines.assert_called_once_with(
            example_pipelines
        )
        patched_data_access_manager.set_db_session.assert_called_once()

        # correct api app is created
        patched_create_api_app_from_project.assert_called_once()

        # an uvicorn server is launched
        patched_uvicorn_run.assert_called_once()

    def test_specific_pipeline(
        self,
        patched_data_access_manager,
        example_pipelines,
    ):
        run_server(pipeline_name="data_science")

        # assert that when running server, data are added correctly to the data access manager
        patched_data_access_manager.add_pipelines.assert_called_once_with(
            {"data_science": example_pipelines["data_science"]}
        )

    @pytest.mark.parametrize(
        "file_path, expected_exception",
        [
            ("test.json", ValueError),  # File does not exist, expect ValueError
            ("test.json", None),  # File exists, expect no ValueError
        ],
    )
    def test_load_file(
        self, file_path, expected_exception, patched_create_api_app_from_file, tmp_path
    ):
        if expected_exception is not None:
            with pytest.raises(expected_exception) as exc_info:
                run_server(load_file=file_path)

            # Check if the error message contains the expected message
            assert "The provided filepath" in str(exc_info.value)
            assert "does not exist." in str(exc_info.value)
        else:
            json_file_path = tmp_path / file_path

            # File exists, no exception expected
            with json_file_path.open("w") as file:
                json.dump({"name": "John", "age": 30}, file)

            run_server(load_file=json_file_path)
            patched_create_api_app_from_file.assert_called_once()

    def test_save_file(self, tmp_path, mocker):
        save_api_responses_to_fs_mock = mocker.patch(
            "kedro_viz.server.save_api_responses_to_fs"
        )
        save_file = tmp_path / "save.json"
        run_server(save_file=save_file)
        save_api_responses_to_fs_mock.assert_called_once_with(save_file)
