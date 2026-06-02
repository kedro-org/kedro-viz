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
        patched_uvicorn_run,
        example_catalog,
        example_pipelines,
    ):
        run_server()
        patched_data_access_manager.add_catalog.assert_called_once_with(
            example_catalog, example_pipelines
        )
        patched_data_access_manager.add_pipelines.assert_called_once_with(
            example_pipelines
        )

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

    def test_load_file(self, patched_create_api_app_from_file, tmp_path):
        file_path = "test.json"
        json_file_path = tmp_path / file_path

        with json_file_path.open("w") as file:
            json.dump({"name": "John", "age": 30}, file)

        run_server(load_file=json_file_path)
        patched_create_api_app_from_file.assert_called_once()

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


# -- Phase 6.2b: inspection-adapter wiring at startup --------------------------------------- #


class TestInspectionAdapterStartup:
    """Cover ``_configure_inspection_adapter_provider`` — the bridge between the env-var flag and
    the runtime data provider slot."""

    @pytest.fixture(autouse=True)
    def _reset_adapter_slot(self):
        from kedro_viz.api.data_provider import set_inspection_adapter_provider

        set_inspection_adapter_provider(None)
        yield
        set_inspection_adapter_provider(None)

    def test_flag_off_does_not_install_adapter(self, monkeypatch):
        """Explicit opt-out (``KEDRO_VIZ_INSPECTION_ADAPTER=0``) keeps the legacy graph path."""
        from kedro_viz.api import data_provider
        from kedro_viz.api.data_provider import INSPECTION_ADAPTER_ENV_VAR
        from kedro_viz.server import _configure_inspection_adapter_provider

        monkeypatch.setenv(INSPECTION_ADAPTER_ENV_VAR, "0")
        _configure_inspection_adapter_provider(
            path="anywhere", env=None, pipeline_name=None, extra_params=None
        )
        assert data_provider._adapter_holder.provider is None

    def test_env_var_unset_installs_adapter_by_default(self, monkeypatch, mocker):
        """6.7 flip: unset means on; the provider is built without an explicit opt-in."""
        from kedro_viz.api import data_provider
        from kedro_viz.api.data_provider import INSPECTION_ADAPTER_ENV_VAR
        from kedro_viz.server import _configure_inspection_adapter_provider

        monkeypatch.delenv(INSPECTION_ADAPTER_ENV_VAR, raising=False)
        provider_stub = object()
        mocker.patch(
            "kedro_viz.api.inspection_adapter_provider.InspectionAdapterProvider",
            return_value=provider_stub,
        )
        _configure_inspection_adapter_provider(
            path="some/path", env=None, pipeline_name=None, extra_params=None
        )
        assert data_provider._adapter_holder.provider is provider_stub

    def test_flag_on_with_extra_params_falls_back_with_log(self, monkeypatch, caplog):
        from kedro_viz.api import data_provider
        from kedro_viz.api.data_provider import INSPECTION_ADAPTER_ENV_VAR
        from kedro_viz.server import _configure_inspection_adapter_provider

        monkeypatch.setenv(INSPECTION_ADAPTER_ENV_VAR, "1")
        with caplog.at_level("INFO", logger="kedro_viz.server"):
            _configure_inspection_adapter_provider(
                path="anywhere",
                env=None,
                pipeline_name=None,
                extra_params={"runtime_param": "value"},
            )
        assert data_provider._adapter_holder.provider is None
        assert any("--params" in r.message for r in caplog.records)

    def test_flag_on_installs_adapter_when_constructor_succeeds(
        self, monkeypatch, mocker
    ):
        from kedro_viz.api import data_provider
        from kedro_viz.api.data_provider import INSPECTION_ADAPTER_ENV_VAR
        from kedro_viz.server import _configure_inspection_adapter_provider

        monkeypatch.setenv(INSPECTION_ADAPTER_ENV_VAR, "1")
        provider_stub = object()
        cls_mock = mocker.patch(
            "kedro_viz.api.inspection_adapter_provider.InspectionAdapterProvider",
            return_value=provider_stub,
        )
        _configure_inspection_adapter_provider(
            path="some/path",
            env="staging",
            pipeline_name="modelling_stage",
            extra_params=None,
        )
        cls_mock.assert_called_once_with(
            "some/path", env="staging", pipeline_name="modelling_stage"
        )
        assert data_provider._adapter_holder.provider is provider_stub

    def test_flag_on_falls_back_when_adapter_construction_raises(
        self, monkeypatch, mocker, caplog
    ):
        from kedro_viz.api import data_provider
        from kedro_viz.api.data_provider import INSPECTION_ADAPTER_ENV_VAR
        from kedro_viz.server import _configure_inspection_adapter_provider

        monkeypatch.setenv(INSPECTION_ADAPTER_ENV_VAR, "1")
        mocker.patch(
            "kedro_viz.api.inspection_adapter_provider.InspectionAdapterProvider",
            side_effect=RuntimeError("kedro<1.4.0"),
        )
        with caplog.at_level("ERROR", logger="kedro_viz.server"):
            _configure_inspection_adapter_provider(
                path="bad/path", env=None, pipeline_name=None, extra_params=None
            )
        assert data_provider._adapter_holder.provider is None
        assert any(
            "Failed to build the inspection adapter" in r.message
            for r in caplog.records
        )


# -- Lite-mode short-circuit in load_and_populate_data --------------------------------------- #


class TestLiteModeAdapter:
    """Adapter ON + ``--lite`` skips the live load when the adapter builds successfully."""

    @pytest.fixture(autouse=True)
    def _reset_adapter_slot(self):
        from kedro_viz.api.data_provider import set_inspection_adapter_provider

        set_inspection_adapter_provider(None)
        yield
        set_inspection_adapter_provider(None)

    def test_flag_on_plus_lite_skips_live_load(self, monkeypatch, mocker, caplog):
        """No ``kedro_data_loader.load_data`` / ``populate_data`` calls in lite mode."""
        from kedro_viz.api.data_provider import INSPECTION_ADAPTER_ENV_VAR

        monkeypatch.setenv(INSPECTION_ADAPTER_ENV_VAR, "1")
        mock_load_data = mocker.patch("kedro_viz.server.kedro_data_loader.load_data")
        mock_populate_data = mocker.patch("kedro_viz.server.populate_data")
        cls_mock = mocker.patch(
            "kedro_viz.api.inspection_adapter_provider.InspectionAdapterProvider",
            return_value=object(),
        )

        from kedro_viz.server import load_and_populate_data

        with caplog.at_level("INFO", logger="kedro_viz.server"):
            load_and_populate_data(path="proj/path", is_lite=True)

        # Neither the live loader nor `populate_data` was invoked.
        mock_load_data.assert_not_called()
        mock_populate_data.assert_not_called()
        # The adapter provider was still built so /api/main + /api/nodes have a backing source.
        cls_mock.assert_called_once_with("proj/path", env=None, pipeline_name=None)
        assert any(
            "skipping the live project load" in r.message for r in caplog.records
        )

    def test_flag_off_plus_lite_still_loads_live(self, monkeypatch, mocker):
        """Legacy `--lite` behaviour (partial live load) is preserved on explicit opt-out."""
        from kedro_viz.api.data_provider import INSPECTION_ADAPTER_ENV_VAR

        monkeypatch.setenv(INSPECTION_ADAPTER_ENV_VAR, "0")
        mock_load_data = mocker.patch(
            "kedro_viz.server.kedro_data_loader.load_data",
            return_value=(mocker.Mock(), {}, {}),
        )
        mocker.patch("kedro_viz.server.populate_data")

        from kedro_viz.server import load_and_populate_data

        load_and_populate_data(path="proj/path", is_lite=True)

        mock_load_data.assert_called_once()

    def test_flag_on_plus_lite_plus_extra_params_does_not_short_circuit(
        self, monkeypatch, mocker
    ):
        """``--params`` forces the live path even under ``--lite`` (D14)."""
        from kedro_viz.api.data_provider import INSPECTION_ADAPTER_ENV_VAR

        monkeypatch.setenv(INSPECTION_ADAPTER_ENV_VAR, "1")
        mock_load_data = mocker.patch(
            "kedro_viz.server.kedro_data_loader.load_data",
            return_value=(mocker.Mock(), {}, {}),
        )
        mocker.patch("kedro_viz.server.populate_data")

        from kedro_viz.server import load_and_populate_data

        load_and_populate_data(path="proj/path", is_lite=True, extra_params={"x": 1})

        mock_load_data.assert_called_once()

    def test_lite_falls_through_to_live_load_when_adapter_build_fails(
        self, monkeypatch, mocker, caplog
    ):
        """If the adapter fails to build under --lite, fall through to the legacy live load.

        Without this fallback, ``data_access_manager`` would stay empty and any subsequent
        request would silently get an empty graph from ``LiveDataProvider``.
        """
        from kedro_viz.api.data_provider import INSPECTION_ADAPTER_ENV_VAR

        monkeypatch.setenv(INSPECTION_ADAPTER_ENV_VAR, "1")
        # Adapter construction raises (could be: stale --pipeline, kedro<1.4.0, etc.)
        mocker.patch(
            "kedro_viz.api.inspection_adapter_provider.InspectionAdapterProvider",
            side_effect=RuntimeError("snapshot build failed"),
        )
        mock_load_data = mocker.patch(
            "kedro_viz.server.kedro_data_loader.load_data",
            return_value=(mocker.Mock(), {}, {}),
        )
        mock_populate_data = mocker.patch("kedro_viz.server.populate_data")

        from kedro_viz.server import load_and_populate_data

        with caplog.at_level("WARNING", logger="kedro_viz.server"):
            load_and_populate_data(path="proj/path", is_lite=True)

        # The legacy live load ran, so the viz has something to serve.
        mock_load_data.assert_called_once()
        mock_populate_data.assert_called_once()
        # A clear warning explains why we fell through.
        assert any(
            "falling through to the legacy --lite live load" in r.message
            for r in caplog.records
        )
