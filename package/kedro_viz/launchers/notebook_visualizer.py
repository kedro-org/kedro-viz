import json
from typing import Any, Dict
import uuid
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
            "behaviour": { 
                "reFocus": False,
            },
            "theme": "dark"
        }

        if options:
            viz_options = merge_dicts(viz_options, options)

        viz_options = json.dumps(viz_options)
        
        # To isolate container for each cell execution
        unique_id = uuid.uuid4().hex[:8]
        
        html_content = r"""<!DOCTYPE html>
        <html lang='en'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Kedro-Viz</title>
        </head>
        <body>
            <div id=kedro-viz-""" + unique_id + """ style='height: 600px'></div>
            <script type="module">
                import { KedroViz, React, createRoot } from "https://cdn.jsdelivr.net/gh/kedro-org/kedro-viz@feat/esm-viz-bundle/esm/kedro-viz.production.mjs"; 
                
                const viz_container = document.getElementById('kedro-viz-""" + unique_id + """');
                        
                if (createRoot && viz_container) {
                    const viz_root = createRoot(viz_container);
                    viz_root.render(
                        React.createElement(KedroViz, {
                            data: """ + json_to_visualize + """,
                            options: """ + viz_options + """
                        })
                    );
                }
            </script>
        </body>
        </html>"""

        # Works but Security errors as KedroViz interacts with Browser history and iframe starts on a different origin
        # This is good for graphview but does not work with click events (Recommended)
        html_content = f"""<iframe srcdoc="{html_content.replace('"', '&quot;')}"  style="width:100%; height:600px; border:none;" sandbox="allow-scripts"></iframe>"""
        display(HTML(html_content))

        # Works but interacts directly with browser window 
        # leading to unexpected URL params, works with click events
        # display(HTML(html_content))
