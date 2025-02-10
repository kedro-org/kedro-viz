import json
import uuid
from typing import Any, Dict, Union

from IPython.display import HTML, display
from kedro.io.data_catalog import DataCatalog
from kedro.pipeline import Pipeline

from kedro_viz.api.rest.responses.pipelines import get_kedro_project_json_data
from kedro_viz.server import load_and_populate_data_for_notebook_users
from kedro_viz.utils import merge_dicts

DEFAULT_VIZ_OPTIONS = {
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
    "theme": "dark",
}

class NotebookVisualizer:
    """Represent a Kedro-Viz visualization instance in a notebook"""
    def __init__(self, pipeline: Union[Pipeline, Dict[str, Pipeline]], catalog: Union[DataCatalog, None] = None, options: Union[Dict[str, Any], None] = None):
        """Create a new instance of ``NotebookVisualizer``
        
        Args:
            pipeline: Kedro Pipeline to visualize
            catalog: Data Catalog for the pipeline
            options: Kedro-Viz visualization options available at
            https://github.com/kedro-org/kedro-viz/blob/main/README.npm.md#configure-kedro-viz-with-options
        
        Returns:
            A new ``NotebookVisualizer`` instance.
        """
        self.pipeline = pipeline
        self.catalog = catalog
        self.options = (
            DEFAULT_VIZ_OPTIONS
            if options is None
            else merge_dicts(DEFAULT_VIZ_OPTIONS, options)
        )

    def get_viz_data(self) -> Union[Any, None]:
        """Get the visualization data to be displayed on Kedro-Viz."""
        load_and_populate_data_for_notebook_users(self.pipeline, self.catalog)
        json_to_visualize = get_kedro_project_json_data()
        return json_to_visualize
    
    @staticmethod
    def get_html(json_to_visualize: Union[Any, None], options: dict[str, Any] = DEFAULT_VIZ_OPTIONS) -> str:
        """Get the html markup template to be displayed using viz data

        Args:
            json_to_visualize (Union[Any, None]): Kedro project pipeline data as a json object

        Returns:
            The HTML markup template as a string
        """

        # To isolate container for each cell execution
        unique_id = uuid.uuid4().hex[:8]

        html_content = (
            r"""<!DOCTYPE html>
        <html lang='en'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Kedro-Viz</title>
        </head>
        <body>
            <div id=kedro-viz-"""
            + unique_id
            + """ style='height: 600px'></div>
            <script type="module">
                import { KedroViz, React, createRoot } from "https://cdn.jsdelivr.net/gh/kedro-org/kedro-viz@feat/esm-viz-bundle/esm/kedro-viz.production.mjs";

                const viz_container = document.getElementById('kedro-viz-"""
            + unique_id
            + """');

                if (createRoot && viz_container) {
                    const viz_root = createRoot(viz_container);
                    viz_root.render(
                        React.createElement(KedroViz, {
                            data: """
            + json.dumps(json_to_visualize)
            + """,
                            options: """
            + json.dumps(options)
            + """
                        })
                    );
                }
            </script>
        </body>
        </html>"""
        )

        return html_content

    @staticmethod
    def embed_html(html_content: str) -> str:
        """Get the html markup template embedded in an iframe
        
        Args:
            html_content (str): The HTML markup template as a string for visualization

        Returns:
            A string containing html markup embedded in an iframe
        """
        return f"""<iframe srcdoc="{html_content.replace('"', '&quot;')}"  style="width:100%; height:600px; border:none;" sandbox="allow-scripts"></iframe>"""
    
    def show(self):
        """Show Kedro-Viz visualization embedded in a notebook for a Kedro Pipeline"""
        json_to_visualize = self.get_viz_data()
        html_content = self.get_html(json_to_visualize, self.options)
        html_with_iframe = self.embed_html(html_content)
        display(HTML(html_with_iframe))
