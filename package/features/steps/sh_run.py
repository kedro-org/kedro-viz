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
# type: ignore
import shlex
import subprocess
from typing import Any, Sequence

import psutil


def run(cmd: str, split: bool = True, print_output: bool = False, **kwargs: Any) -> int:
    """
    Args:
        cmd: A command string, or a command followed by program
            arguments that will be submitted to POpen to run.

        split: Flag that splits command to provide as multiple *args
            to Popen. Default is True.

        print_output: If True will print previously captured stdout.
            Default is False.

        kwargs: Extra options to pass to subprocess.

    Example:
    ::
        "ls"
        "ls -la"
        "chmod 754 local/file"

    Returns:
        Result with attributes args, returncode, stdout and
        stderr. By default, stdout and stderr are not captured, and those
        attributes will be None. Pass stdout=PIPE and/or stderr=PIPE in order
        to capture them.

    """
    if isinstance(cmd, str) and split:
        cmd = shlex.split(cmd)
    result = subprocess.run(
        cmd, input="", stdout=subprocess.PIPE, stderr=subprocess.PIPE, **kwargs
    )
    result.stdout = result.stdout.decode("utf-8")
    result.stderr = result.stderr.decode("utf-8")
    if print_output:
        print(result.stdout)
    return result


class ChildTerminatingPopen(subprocess.Popen):
    """
    Extend subprocess.Popen class to automatically kill child processes when
    terminated
     Note:
        On GNU/Linux child processes are not killed automatically if the parent
        dies (so-called orphan processes)
    """

    def __init__(self, cmd: Sequence[str], **kwargs) -> None:
        """
        Initializer pipes stderr and stdout.

        Args:
            cmd: command to be run.
            **kwargs: keyword arguments such as env and cwd

        """
        super(ChildTerminatingPopen, self).__init__(cmd, **kwargs)

    def terminate(self) -> None:
        """Terminate process and children"""
        try:
            proc = psutil.Process(self.pid)
            procs = [proc] + proc.children(recursive=True)
        except psutil.NoSuchProcess:
            pass
        else:
            for proc in procs:
                try:
                    proc.terminate()
                except psutil.NoSuchProcess:
                    pass
            psutil.wait_procs(procs)
