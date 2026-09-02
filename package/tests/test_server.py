import json
from pathlib import Path

import pytest
from pydantic import BaseModel

from kedro_viz.server import load_and_populate_data, run_server


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
def patched_create_viz_project_context(mocker):
    """These tests drive startup against a mock path, which has no snapshot to read."""
    yield mocker.patch("kedro_viz.server._create_viz_project_context")


@pytest.fixture(autouse=True)
def patched_load_data(
    mocker, example_catalog, example_pipelines, example_node_extras_dict
):
    yield mocker.patch(
        "kedro_viz.server.kedro_data_loader.load_data",
        return_value=(
            example_catalog,
            example_pipelines,
            example_node_extras_dict,
        ),
    )


class TestServer:
    def test_run_server_from_project(
        self,
        patched_create_api_app_from_project,
        patched_data_access_manager,
        patched_create_viz_project_context,
        patched_uvicorn_run,
        example_catalog,
        example_pipelines,
    ):
        events = []
        patched_data_access_manager.add_pipelines.side_effect = lambda _: events.append(
            "populated"
        )
        context = patched_create_viz_project_context.return_value
        patched_create_viz_project_context.side_effect = lambda *args, **kwargs: (
            events.append("context") or context
        )

        run_server()

        patched_data_access_manager.add_catalog.assert_called_once_with(
            example_catalog, example_pipelines
        )
        patched_data_access_manager.add_pipelines.assert_called_once_with(
            example_pipelines
        )
        patched_create_viz_project_context.assert_called_once_with(
            Path.cwd(),
            patched_data_access_manager,
            env=None,
            pipeline_name=None,
            extra_params=None,
            package_name=None,
            is_lite=False,
            include_hooks=False,
        )
        assert events == ["populated", "context"]

        patched_create_api_app_from_project.assert_called_once_with(
            context, Path.cwd(), False
        )

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

    def test_runtime_options_are_forwarded_to_context_creation(
        self,
        patched_create_viz_project_context,
        patched_data_access_manager,
        tmp_path,
    ):
        runtime_params = {"split": {"test_size": 0.3}}

        run_server(
            project_path=str(tmp_path),
            env="staging",
            pipeline_name="data_science",
            extra_params=runtime_params,
            package_name="spaceflights",
            is_lite=True,
            include_hooks=True,
        )

        patched_create_viz_project_context.assert_called_once_with(
            tmp_path,
            patched_data_access_manager,
            env="staging",
            pipeline_name="data_science",
            extra_params=runtime_params,
            package_name="spaceflights",
            is_lite=True,
            include_hooks=True,
        )

    def test_load_and_populate_data_returns_repositories_without_creating_a_context(
        self, patched_create_viz_project_context, patched_data_access_manager
    ):
        result = load_and_populate_data(Path.cwd())

        assert result is patched_data_access_manager
        patched_create_viz_project_context.assert_not_called()

    def test_load_file(
        self,
        patched_create_api_app_from_file,
        patched_create_viz_project_context,
        tmp_path,
    ):
        file_path = "test.json"
        json_file_path = tmp_path / file_path

        with json_file_path.open("w") as file:
            json.dump({"name": "John", "age": 30}, file)

        run_server(load_file=json_file_path)
        patched_create_api_app_from_file.assert_called_once()
        patched_create_viz_project_context.assert_not_called()

    def test_save_file(self, tmp_path, mocker):
        mock_filesystem = mocker.patch("fsspec.filesystem")
        save_api_responses_to_fs_mock = mocker.patch(
            "kedro_viz.api.rest.responses.save_responses.save_api_responses_to_fs"
        )
        save_file = tmp_path / "save.json"
        run_server(save_file=save_file)
        save_api_responses_to_fs_mock.assert_called_once_with(
            save_file, mock_filesystem.return_value, True
        )
