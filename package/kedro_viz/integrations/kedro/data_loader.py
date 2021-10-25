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
"""`kedro_viz.integrations.kedro.data_loader` provides interface to
load data from a Kedro project. It takes care of making sure viz can
load data from projects created in a range of Kedro versions.
"""
# pylint: disable=import-outside-toplevel
# pylint: disable=protected-access
from pathlib import Path
from typing import Dict, Optional, Tuple, cast

from kedro import __version__
from kedro.io import DataCatalog
from kedro.pipeline import Pipeline
from semver import VersionInfo

from kedro_viz.integrations.kedro.sqlite_store import SQLiteStore

KEDRO_VERSION = VersionInfo.parse(__version__)


def _bootstrap(project_path: Path):
    """Bootstrap the integration by running various Kedro bootstrapping methods
    depending on the version
    """
    if KEDRO_VERSION.match(">=0.17.3"):
        from kedro.framework.startup import bootstrap_project

        bootstrap_project(project_path)
        return

    if KEDRO_VERSION.match(">=0.17.1"):
        from kedro.framework.project import configure_project
        from kedro.framework.startup import _get_project_metadata

        package_name = _get_project_metadata(project_path).package_name

        configure_project(package_name)
        return


def load_data(
    project_path: Path, env: str = None
) -> Tuple[DataCatalog, Dict[str, Pipeline], Optional[Path]]:
    """Load data from a Kedro project.
    Args:
        project_path: the path whether the Kedro project is located.
        env: the Kedro environment to load the data. If not provided.
            it will use Kedro default, which is local.
    Returns:
        A tuple containing the data catalog and the pipeline dictionary
        and the session store location path (this can be NONE if session_store
        is turned off or for Kedro 16 hence Optional)
    """
    _bootstrap(project_path)

    if KEDRO_VERSION.match(">=0.17.3"):
        from kedro.framework.project import pipelines
        from kedro.framework.session import KedroSession

        with KedroSession.create(
            project_path=project_path, env=env, save_on_close=False
        ) as session:

            context = session.load_context()
            session_store = session._store
            session_store_location = None
            if isinstance(session_store, SQLiteStore):
                session_store_location = session_store.location

        return context.catalog, cast(Dict, pipelines), session_store_location

    if KEDRO_VERSION.match(">=0.17.1"):
        from kedro.framework.session import KedroSession

        with KedroSession.create(
            project_path=project_path, env=env, save_on_close=False
        ) as session:

            context = session.load_context()
            session_store = session._store
            session_store_location = None
            if isinstance(session_store, SQLiteStore):
                session_store_location = session_store.location

        return context.catalog, context.pipelines, session_store_location

    if KEDRO_VERSION.match("==0.17.0"):
        from kedro.framework.session import KedroSession
        from kedro.framework.startup import _get_project_metadata

        metadata = _get_project_metadata(project_path)
        with KedroSession.create(
            package_name=metadata.package_name,
            project_path=project_path,
            env=env,
            save_on_close=False,
        ) as session:

            context = session.load_context()
            session_store = session._store
            session_store_location = None
            if isinstance(session_store, SQLiteStore):
                session_store_location = session_store.location

        return context.catalog, context.pipelines, session_store_location

    # pre-0.17 load_context version
    from kedro.framework.context import load_context

    context = load_context(project_path=project_path, env=env)
    return context.catalog, context.pipelines, None
