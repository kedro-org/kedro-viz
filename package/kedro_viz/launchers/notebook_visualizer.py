import json
from typing import Any, Dict
from IPython.display import HTML, display
from kedro.io.data_catalog import DataCatalog
from kedro.pipeline import Pipeline
from kedro_viz.api.rest.responses.pipelines import get_kedro_project_json_data
from kedro_viz.server import load_and_populate_data_for_notebook_users
from kedro_viz.utils import NotebookUser, merge_dicts

class NotebookVisualizer:
    def show(self, pipeline: Pipeline, catalog: DataCatalog = None, options: Dict[str, Any] = None):
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
        # [TODO: <script src='http://localhost:8000/kedroViz.bundle.js'></script> - This needs publishing to CDN (may be bundle it and publish on npm)]
        notebook_user = NotebookUser(pipeline=pipeline, catalog=catalog)
        load_and_populate_data_for_notebook_users(notebook_user)
        json_to_visualize = json.dumps(get_kedro_project_json_data())

        viz_options = {
            "display": {
                "expandPipelinesBtn": False,
                "exportBtn": False,
                "globalNavigation": False,
                "labelBtn": False,
                "layerBtn": False,
                "metadataPanel": False,
                "miniMap": False,
                "sidebar": False,
                "zoomToolbar": False,
            },
            "expandAllPipelines": False,
            "theme": "dark"
        }

        if options:
            viz_options = merge_dicts(viz_options, options)

        viz_options = json.dumps(viz_options)

        html_content = r"""<!DOCTYPE html>
        <html lang='en'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Kedro-Viz</title>
        </head>
        <body>
            <div id='root' style='height: 600px'></div>
            <script src='http://localhost:8012/kedroViz.bundle.min.js'></script>
            <script>
                window.viz_container =  document.getElementById('root');

                if (window.createRoot) {
                    window.viz_root = window.createRoot(window.viz_container);
                    window.viz_root && window.viz_root.render(window.React.createElement(window.KedroViz, { data: """ + json_to_visualize + r""", options: """ + viz_options + r""" }));
                }
            </script>
        </body>
        </html>"""

        display(HTML(html_content))
