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
"""`kedro_viz.integrations.kedro.telemetry` helps integrate Kedro Viz with Kedro-Telemetry
"""
import hashlib
import socket
from pathlib import Path
from typing import Optional

import yaml

try:
    from kedro_telemetry.plugin import _get_heap_app_id, _is_valid_syntax

    _IS_TELEMETRY_INSTALLED = True
except ImportError:  # pragma: no cover
    _IS_TELEMETRY_INSTALLED = False


def get_heap_app_id(project_path: Path) -> Optional[str]:
    """Return the Heap App ID used for Kedro telemetry if user has given consent."""
    if not _IS_TELEMETRY_INSTALLED:  # pragma: no cover
        return None
    telemetry_file_path = project_path / ".telemetry"
    if not telemetry_file_path.exists():
        return None
    with open(telemetry_file_path) as telemetry_file:
        telemetry = yaml.safe_load(telemetry_file)
        if _is_valid_syntax(telemetry) and telemetry["consent"]:
            return _get_heap_app_id()
    return None


def get_heap_identity() -> Optional[str]:  # pragma: no cover
    """Return the user ID in heap identical to the id used by kedro-telemetry plugin."""
    if not _IS_TELEMETRY_INSTALLED:
        return None
    try:
        return hashlib.sha512(bytes(socket.gethostname(), encoding="utf8")).hexdigest()
    except socket.timeout:
        return None
