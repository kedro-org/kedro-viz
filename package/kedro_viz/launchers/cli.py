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
"""`kedro_viz.launchers.cli` launches the viz server as a CLI app."""

import traceback

import click
from kedro.framework.cli.utils import KedroCliError

from kedro_viz.server import run_server


@click.group(name="Kedro-Viz")
def commands():
    """Visualise the pipeline using Kedro viz."""


@commands.command(context_settings=dict(help_option_names=["-h", "--help"]))
@click.option(
    "--host",
    default="127.0.0.1",
    help="Host that viz will listen to. Defaults to 127.0.0.1.",
)
@click.option(
    "--port",
    default=4141,
    type=int,
    help="TCP port that viz will listen to. Defaults to 4141.",
)
@click.option(
    "--browser/--no-browser",
    default=True,
    help="Whether to open viz interface in the default browser or not. "
    "Browser will only be opened if host is localhost. Defaults to True.",
)
@click.option(
    "--load-file",
    default=None,
    type=click.Path(exists=True, dir_okay=False),
    help="Path to load the pipeline JSON file",
)
@click.option(
    "--save-file",
    default=None,
    type=click.Path(dir_okay=False, writable=True),
    help="Path to save the pipeline JSON file",
)
@click.option(
    "--pipeline",
    type=str,
    default=None,
    help="Name of the modular pipeline to visualise. "
    "If not set, the default pipeline is visualised",
)
@click.option(
    "--env",
    "-e",
    type=str,
    default=None,
    multiple=False,
    envvar="KEDRO_ENV",
    help="Kedro configuration environment. If not specified, "
    "catalog config in `local` will be used",
)
def viz(host, port, browser, load_file, save_file, pipeline, env):
    """Visualise a Kedro pipeline using Kedro viz."""
    try:
        run_server(host, port, browser, load_file, save_file, pipeline, env)
    except Exception as ex:  # pragma: no cover
        traceback.print_exc()
        raise KedroCliError(str(ex)) from ex
