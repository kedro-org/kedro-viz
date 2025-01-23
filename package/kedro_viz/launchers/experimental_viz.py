import json
from pathlib import Path
from IPython.display import HTML, IFrame, display
from kedro.io.data_catalog import DataCatalog
from kedro.pipeline import Pipeline
from kedro_viz.api.rest.responses.pipelines import get_kedro_project_json_data
from kedro_viz.server import load_and_populate_data_for_notebook_users
from kedro_viz.utils import NotebookUser

class KedroVizNotebook:
    
    def visualize(self, pipeline: Pipeline, catalog: DataCatalog = None, embed_in_notebook=True):
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
        
        # To be configured as arg
        view_options = {"onlyChartView": "true"}
        # Define the HTML content
        html_content = f"""
        <!DOCTYPE html>
        <html lang='en'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Kedro-Viz</title>
        </head>
        <body>
            <div id='root'></div>
            <script>
                window.__APP_CONFIG__ = {view_options};
            </script>
            <script src='http://localhost:8000/kedroViz.bundle.js'></script>
            <script>
                viz_data = {json_to_visualize};
                const {{ React, createRoot, KedroViz }} = window;
                const container = document.getElementById('root');
                const root = createRoot(container);
                root.render(React.createElement(KedroViz));
            </script>
        </body>
        </html>
        """

        # Save the HTML file in the current directory
        viz_folder = Path(".viz")
        viz_folder.mkdir(exist_ok=True)
        
        # Define the HTML file path
        file_path = Path(viz_folder / "jupyter_viz_exploration.html")

        with open(file_path, "w") as f:
            f.write(html_content)

        if embed_in_notebook:
            display(IFrame(src=file_path, width="100%", height="600"))
        else:
            link_html = f'<a href="{file_path}" target="_blank">Open Kedro-Viz</a>'
            display(HTML(link_html))
            