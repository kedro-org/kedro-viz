import json
import logging
import uuid
from contextlib import contextmanager
from typing import Any, Dict, Optional, Union

from IPython.display import HTML, display
from kedro.io.data_catalog import DataCatalog
from kedro.pipeline import Pipeline

from kedro_viz.api.rest.responses.pipelines import get_kedro_project_json_data
from kedro_viz.integrations.notebook.data_loader import (
    load_and_populate_data_for_notebook_users,
)
from kedro_viz.utils import Spinner, merge_dicts

DEFAULT_VIZ_OPTIONS = {
    "display": {
        "expandPipelinesBtn": False,
        "globalNavigation": False,
        "exportBtn": False,
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
    "width": "100%",
    "height": "600px",
}

DEFAULT_JS_URL = (
    "https://cdn.jsdelivr.net/gh/kedro-org/kedro-viz@main/esm/kedro-viz.production.mjs"
)


class NotebookVisualizer:
    """Represent a Kedro-Viz visualization instance in a notebook"""

    def __init__(
        self,
        pipeline: Union[Pipeline, Dict[str, Pipeline]],
        catalog: Optional[DataCatalog] = None,
        options: Optional[Dict[str, Any]] = None,
        js_url: Optional[str] = None,
    ):
        """
        Initialize NotebookVisualizer.

        Args:
            pipeline: Kedro pipeline(s) to visualize.
            catalog: Kedro data catalog.
            options: Visualization options.
            (Ref: https://github.com/kedro-org/kedro-viz/blob/main/README.npm.md#configure-kedro-viz-with-options)
            js_url: Optional URL for the Kedro-Viz JS bundle.

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
        # Force `globalNavigation` to always be False as it
        # breaks visualizer due to security concerns
        self.options.setdefault("display", {})["globalNavigation"] = False  # type: ignore[index]

        self.js_url = js_url or DEFAULT_JS_URL

    def _load_viz_data(self) -> Optional[Any]:
        """Load pipeline and catalog data for visualization."""
        load_and_populate_data_for_notebook_users(self.pipeline, self.catalog)
        return get_kedro_project_json_data()

    def generate_html(self) -> str:
        """Generate HTML markup for Kedro-Viz as a string."""
        unique_id = uuid.uuid4().hex[:8]  # To isolate container for each cell execution
        json_data_str = json.dumps(self._load_viz_data())
        options_str = json.dumps(self.options)

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
                import { KedroViz, React, createRoot } from '"""
            + self.js_url
            + """';
                const viz_container = document.getElementById('kedro-viz-"""
            + unique_id
            + """');

                if (createRoot && viz_container) {
                    const viz_root = createRoot(viz_container);
                    viz_root.render(
                        React.createElement(KedroViz, {
                            data: """
            + json_data_str
            + """,
                            options: """
            + options_str
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
    def _wrap_in_iframe(
        html_content: str,
        width: str = str(DEFAULT_VIZ_OPTIONS.get("width", "")),
        height: str = str(DEFAULT_VIZ_OPTIONS.get("height", "")),
    ) -> str:
        """Wrap the HTML content in an iframe.

        Args:
            html_content: The HTML markup template as a string for visualization
            width: iframe width
            height: iframe height

        Returns:
            A string containing html markup embedded in an iframe
        """
        sanitized_content = html_content.replace('"', "&quot;")
        return f"""<iframe srcdoc="{sanitized_content}"  style="width:{width}; height:{height}; border:none;" sandbox="allow-scripts"></iframe>"""

    @staticmethod
    @contextmanager
    def _suppress_logs():
        logger = logging.getLogger()
        previous_level = logger.level
        logger.setLevel(logging.CRITICAL)  # Suppress logs
        try:
            yield
        finally:
            logger.setLevel(previous_level)  # Restore the original level

    def show(self) -> None:
        """Display Kedro-Viz in a notebook."""
        with self._suppress_logs():
            try:
                spinner = Spinner("Starting Kedro-Viz...")
                spinner.start()

                html_content = self.generate_html()
                iframe_content = self._wrap_in_iframe(
                    html_content,
                    str(self.options.get("width", "100%")),
                    str(self.options.get("height", "600px")),
                )
                spinner.stop()
                display(HTML(iframe_content))
            except Exception as exc:  # noqa: BLE001
                spinner.stop()
                display(HTML(f"<strong>Error: {str(exc)}</strong>"))
