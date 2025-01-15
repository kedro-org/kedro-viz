import multiprocessing
from typing import Dict

from IPython.display import HTML, IFrame, display
from kedro.io.data_catalog import DataCatalog
from kedro.pipeline import Pipeline

from kedro_viz.constants import DEFAULT_HOST, DEFAULT_PORT
from kedro_viz.launchers.jupyter import _allocate_port
from kedro_viz.launchers.utils import _check_viz_up, _wait_for
from kedro_viz.server import run_server
from kedro_viz.utils import NotebookUser

_VIZ_PROCESSES: Dict[str, int] = {}

class KedroVizNotebook:
    def visualize(self, pipeline: Pipeline, catalog: DataCatalog = None, host: str = DEFAULT_HOST, port: int = DEFAULT_PORT, embed_in_notebook=True):
        """
        Show the visualization either in a browser or embedded in a notebook.

        Args:
            pipeline: Kedro Pipeline to visualize
            catalog: Data Catalog for the pipeline
            host: the host to launch the webserver
            port: the port to launch the webserver
            embed_in_notebook (bool): Whether to embed the visualization in the notebook.

        Raises:
            RuntimeError: If the server is not running.
        """

        print("The pipeline we get::", pipeline)

        # Allocate port
        port = _allocate_port(host, start_at=port)

        # Terminate existing process if needed
        if port in _VIZ_PROCESSES and _VIZ_PROCESSES[port].is_alive():
            _VIZ_PROCESSES[port].terminate()

        notebook_user = NotebookUser(pipeline=pipeline, catalog=catalog)

        run_server_kwargs = {
            "host": host,
            "port": port,
            "notebook_user": notebook_user
        }

        process_context = multiprocessing.get_context("fork")
        viz_process = process_context.Process(
            target=run_server, daemon=True, kwargs={**run_server_kwargs}
        )

        viz_process.start()
        _VIZ_PROCESSES[port] = viz_process

        _wait_for(func=_check_viz_up, host=host, port=port)

        url = f"http://{host}:{port}/"

        if embed_in_notebook:
            display(IFrame(src=url, width=900, height=600))
        else:
            link_html = f'<a href="{url}" target="_blank">Open Kedro-Viz</a>'
            display(HTML(link_html))
