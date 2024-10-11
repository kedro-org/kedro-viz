import pytest

from kedro_viz.launchers.jupyter import _VIZ_PROCESSES, run_viz
from kedro_viz.launchers.utils import WaitForException
from kedro_viz.server import run_server


@pytest.fixture
def patched_check_viz_up(mocker):
    mocker.patch("kedro_viz.launchers.jupyter._check_viz_up", return_value=True)


class TestRunVizLineMagic:
    def test_run_viz(self, mocker, patched_check_viz_up):
        mock_process_context = mocker.patch("multiprocessing.get_context")
        mock_context_instance = mocker.Mock()

        mock_process_context.return_value = mock_context_instance
        mock_process = mocker.patch.object(mock_context_instance, "Process")
        mock_jupyter_display = mocker.patch("kedro_viz.launchers.jupyter.display")

        run_viz()

        mock_process_context.assert_called_once_with("spawn")
        mock_process.assert_called_once_with(
            target=run_server,
            daemon=True,
            kwargs={
                "project_path": None,
                "host": "127.0.0.1",
                "port": 4141,
                "load_file": None,
                "save_file": None,
                "pipeline_name": None,
                "env": None,
                "autoreload": False,
                "include_hooks": False,
                "package_name": None,
                "extra_params": "",
            },
        )
        mock_jupyter_display.assert_called_once()
        assert set(_VIZ_PROCESSES.keys()) == {4141}

        # call run_viz another time should reuse the same port
        mock_process.reset_mock()

        run_viz("--include-hooks")

        mock_process.assert_called_once_with(
            target=run_server,
            daemon=True,
            kwargs={
                "project_path": None,
                "host": "127.0.0.1",
                "port": 4141,
                "load_file": None,
                "save_file": None,
                "pipeline_name": None,
                "env": None,
                "autoreload": False,
                "include_hooks": True,
                "package_name": None,
                "extra_params": "",
            },
        )
        assert set(_VIZ_PROCESSES.keys()) == {4141}

    def test_run_viz_invalid_port(self, mocker, patched_check_viz_up):
        with pytest.raises(ValueError):
            run_viz("--port=999999")

    def test_exception_when_viz_cannot_be_launched(self, mocker):
        mocker.patch(
            "kedro_viz.launchers.jupyter._check_viz_up", side_effect=Exception("Test")
        )
        # Reduce the timeout argument from 60 to 1 to make test run faster.
        mocker.patch(
            "kedro_viz.launchers.jupyter._wait_for.__defaults__", (True, 1, True, 1)
        )
        with pytest.raises(WaitForException):
            run_viz()

    def test_run_viz_on_databricks(self, mocker, patched_check_viz_up, monkeypatch):
        monkeypatch.setenv("DATABRICKS_RUNTIME_VERSION", "1")
        mock_process_context = mocker.patch("multiprocessing.get_context")
        mock_context_instance = mocker.Mock()

        mock_process_context.return_value = mock_context_instance
        mock_process = mocker.patch.object(mock_context_instance, "Process")
        mocker.patch("kedro_viz.launchers.jupyter._is_databricks", return_value=True)
        databricks_display = mocker.patch(
            "kedro_viz.launchers.jupyter._display_databricks_html"
        )
        mock_process.reset_mock()
        run_viz()
        mock_process.assert_called_once_with(
            target=run_server,
            daemon=True,
            kwargs={
                "project_path": None,
                "host": "0.0.0.0",
                "port": 4141,
                "load_file": None,
                "save_file": None,
                "pipeline_name": None,
                "env": None,
                "autoreload": False,
                "include_hooks": False,
                "package_name": None,
                "extra_params": "",
            },
        )
        databricks_display.assert_called_once()

    def test_run_viz_creates_correct_link(self, mocker, patched_check_viz_up):
        mock_process_context = mocker.patch("multiprocessing.get_context")
        mock_context_instance = mocker.Mock()
        mock_process_context.return_value = mock_context_instance
        mock_process = mocker.patch.object(mock_context_instance, "Process")
        mock_display_html = mocker.patch("kedro_viz.launchers.jupyter.display")

        run_viz()

        mock_process.assert_called_once()
        mock_display_html.assert_called_once()

        displayed_html = mock_display_html.call_args[0][0].data
        assert 'target="_blank"' in displayed_html
        assert "Open Kedro-Viz" in displayed_html

    def test_run_viz_with_autoreload(self, mocker, patched_check_viz_up):
        mock_process_context = mocker.patch("multiprocessing.get_context")
        mock_context_instance = mocker.Mock()
        mock_process_context.return_value = mock_context_instance
        mock_process = mocker.patch.object(mock_context_instance, "Process")

        run_viz("--autoreload", None)

        mock_process.assert_called_once_with(
            target=mocker.ANY,
            daemon=False,  # No daemon for autoreload
            args=mocker.ANY,
            kwargs=mocker.ANY,
        )

    def test_run_viz_without_autoreload(self, mocker, patched_check_viz_up):
        mock_process_context = mocker.patch("multiprocessing.get_context")
        mock_context_instance = mocker.Mock()
        mock_process_context.return_value = mock_context_instance
        mock_process = mocker.patch.object(mock_context_instance, "Process")

        run_viz("", None)

        mock_process.assert_called_once_with(
            target=run_server, daemon=True, kwargs=mocker.ANY
        )
