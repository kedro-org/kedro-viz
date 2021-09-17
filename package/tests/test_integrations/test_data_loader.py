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
import datetime
import json
from pathlib import Path

import pytest

from kedro_viz.integrations.kedro import data_loader


@pytest.fixture
def metrics_filepath(tmpdir):
    dir_name = ["2021-09-10T09.02.44.245Z", "2021-09-10T09.03.23.733Z"]
    filename = "metrics.json"
    json_content = [
        {
            "recommendations": 0.3866563620506992,
            "recommended_controls": 0.48332045256337397,
            "projected_optimization": 0.5799845430760487,
        },
        {
            "recommendations": 0.200383330721228,
            "recommended_controls": 0.250479163401535,
            "projected_optimization": 0.30057499608184196,
        },
    ]
    source_dir = Path(tmpdir / filename)
    for index, directory in enumerate(dir_name):
        filepath = Path(source_dir / directory / filename)
        filepath.parent.mkdir(parents=True, exist_ok=True)
        filepath.write_text(json.dumps(json_content[index]))
    return source_dir


def test_load_data_for_all_versions(metrics_filepath):
    mock_metrics_json = {
        datetime.datetime(2021, 9, 10, 9, 2, 44, 245000): {
            "recommendations": 0.3866563620506992,
            "recommended_controls": 0.48332045256337397,
            "projected_optimization": 0.5799845430760487,
        },
        datetime.datetime(2021, 9, 10, 9, 3, 23, 733000): {
            "recommendations": 0.200383330721228,
            "recommended_controls": 0.250479163401535,
            "projected_optimization": 0.30057499608184196,
        },
    }
    assert data_loader.load_data_for_all_versions(metrics_filepath) == mock_metrics_json


def test_load_data_for_all_versions_set_limit(metrics_filepath):
    mock_metrics_json = {
        datetime.datetime(2021, 9, 10, 9, 3, 23, 733000): {
            "recommendations": 0.200383330721228,
            "recommended_controls": 0.250479163401535,
            "projected_optimization": 0.30057499608184196,
        },
    }
    limit = 1
    assert (
        data_loader.load_data_for_all_versions(metrics_filepath, limit)
        == mock_metrics_json
    )
