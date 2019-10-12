# Copyright 2018-2019 QuantumBlack Visual Analytics Limited
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
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
#     or use the QuantumBlack Trademarks in any other manner that might cause
# confusion in the marketplace, including but not limited to in advertising,
# on websites, or on software.
#
# See the License for the specific language governing permissions and
# limitations under the License.

"""Common functions for e2e testing.
"""

import os
import subprocess
import tempfile
import venv
from pathlib import Path

import requests

PIP_INSTALL_SCRIPT = "https://bootstrap.pypa.io/get-pip.py"


def download_url(url: str) -> str:
    """
    Download and return decoded contents of url

    Args:
        url: Url that is to be read.

    Returns:
        Decoded data fetched from url.

    """
    requests.adapters.DEFAULT_RETRIES = 1
    return requests.get(url).text


def create_new_venv() -> str:
    """
    Create a new venv

    Note: Due to a bug in Python 3.5.2 pip needs to be manually installed

    Returns:
        path to created venv
    """
    # Create venv
    venv_dir = tempfile.mkdtemp()
    venv.main([venv_dir, "--without-pip"])

    if os.name == "posix":
        python_executable = Path(venv_dir) / "bin" / "python"
    else:
        python_executable = Path(venv_dir) / "Scripts" / "python.exe"

    # Download and run pip installer
    # Windows blocks access unless delete set to False
    with tempfile.NamedTemporaryFile(delete=False) as tmp_file:
        tmp_file.write(download_url(PIP_INSTALL_SCRIPT).encode())
        tmp_file.flush()
        os.fsync(tmp_file)
        subprocess.check_call([str(python_executable), tmp_file.name])

    os.unlink(tmp_file.name)
    return venv_dir
