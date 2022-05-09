import pytest

from kedro_viz.launchers.jupyter import _VIZ_PROCESSES, WaitForException, run_viz
from kedro_viz.server import run_server


@pytest.fixture
def patched_check_viz_up(mocker):
    mocker.patch("kedro_viz.launchers.jupyter._check_viz_up", return_value=True)


class TestRunVizLineMagic:
    def test_run_viz(self, mocker, patched_check_viz_up):
        process_init = mocker.patch("multiprocessing.Process")
        jupyter_display = mocker.patch("kedro_viz.launchers.jupyter.display")
        run_viz()
        process_init.assert_called_once_with(
            target=run_server, daemon=True, kwargs={"port": 4141}
        )
        jupyter_display.assert_called_once()
        assert set(_VIZ_PROCESSES.keys()) == {4141}

        # call run_viz another time should reuse the same port
        process_init.reset_mock()
        run_viz()
        process_init.assert_called_once_with(
            target=run_server, daemon=True, kwargs={"port": 4141}
        )
        assert set(_VIZ_PROCESSES.keys()) == {4141}

    def test_run_viz_invalid_port(self, mocker, patched_check_viz_up):
        mocker.patch("multiprocessing.Process")
        mocker.patch("kedro_viz.launchers.jupyter.display")
        with pytest.raises(ValueError):
            run_viz(port=999999)

    def test_exception_when_viz_cannot_be_launched(self, mocker):
        mocker.patch(
            "kedro_viz.launchers.jupyter._check_viz_up", side_effect=Exception("Test")
        )
        with pytest.raises(WaitForException):
            run_viz()
