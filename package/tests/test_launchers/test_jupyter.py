# Copyright 2021 QuantumBlack Visual Analytics Limited
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
# OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
# NONINFRINGEMENT. IN NO EVENT WILL THE LICENSOR OR OTHER CONTRIBUTORS
# BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN
# ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF, OR IN
# CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
#
# The QuantumBlack Visual Analytics Limited ("QuantumBlack") name and logo
# (either separately or in combination, "QuantumBlack Trademarks") are
# trademarks of QuantumBlack. The License does not grant you any right or
# license to the QuantumBlack Trademarks. You may not use the QuantumBlack
# Trademarks or any confusingly similar mark as a trademark for your product,
# or use the QuantumBlack Trademarks in any other manner that might cause
# confusion in the marketplace, including but not limited to in advertising,
# on websites, or on software.
#
# See the License for the specific language governing permissions and
# limitations under the License.
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
