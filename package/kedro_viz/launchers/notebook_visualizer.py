import json
import uuid
from typing import Any, Dict, Union

from IPython.display import HTML, display
from kedro.io.data_catalog import DataCatalog
from kedro.pipeline import Pipeline

from kedro_viz.api.rest.responses.pipelines import get_kedro_project_json_data
from kedro_viz.server import load_and_populate_data_for_notebook_users
from kedro_viz.utils import NotebookUser


class NotebookVisualizer:
    """Represent a Kedro-Viz visualization instance in a notebook"""

    def show(
        self,
        pipeline: Union[Pipeline, Dict[str, Pipeline]],
        catalog: Union[DataCatalog, None] = None,
        options: Union[Dict[str, Any], None] = None,
    ):
        """
        Show Kedro-Viz visualization embedded in a notebook for a Kedro Pipeline

        Args:
            pipeline: Kedro Pipeline to visualize
            catalog: Data Catalog for the pipeline
            options: Kedro-Viz visualization options available at
            https://github.com/kedro-org/kedro-viz/blob/main/README.npm.md#configure-kedro-viz-with-options
        """
        notebook_user = NotebookUser(
            pipeline=pipeline, catalog=catalog, options=options
        )
        load_and_populate_data_for_notebook_users(notebook_user)
        json_to_visualize = json.dumps(get_kedro_project_json_data())
        viz_options = json.dumps(notebook_user.options)

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
            + json_to_visualize
            + """,
                            options: """
            + viz_options
            + """
                        })
                    );
                }
            </script>
        </body>
        </html>"""
        )

        html_content = f"""<iframe srcdoc="{html_content.replace('"', '&quot;')}"  style="width:100%; height:600px; border:none;" sandbox="allow-scripts"></iframe>"""
        display(HTML(html_content))
