import json
from unittest.mock import patch

from IPython.display import HTML

from kedro_viz.launchers.notebook_visualizer import (
    DEFAULT_JS_URL,
    DEFAULT_VIZ_OPTIONS,
    NotebookVisualizer,
)


class TestNotebookVisualizer:
    def test_notebook_visualizer_init(self, example_pipelines, example_catalog):
        notebook_visualizer = NotebookVisualizer(example_pipelines, example_catalog)
        assert isinstance(notebook_visualizer, NotebookVisualizer)
        assert notebook_visualizer.pipeline == example_pipelines
        assert notebook_visualizer.catalog == example_catalog
        assert notebook_visualizer.options == DEFAULT_VIZ_OPTIONS
        assert notebook_visualizer.js_url == DEFAULT_JS_URL

    def test_load_viz_data(self, example_pipelines, example_catalog, mocker):
        notebook_visualizer = NotebookVisualizer(example_pipelines, example_catalog)

        mock_load = mocker.patch(
            "kedro_viz.launchers.notebook_visualizer.load_and_populate_data_for_notebook_users"
        )
        mock_get_project_json = mocker.patch(
            "kedro_viz.launchers.notebook_visualizer.get_kedro_project_json_data"
        )

        notebook_visualizer._load_viz_data()

        mock_load.assert_called_once_with(
            notebook_visualizer.pipeline, notebook_visualizer.catalog
        )
        mock_get_project_json.assert_called_once()

    def test_generate_html(self):
        mock_json = {"nodes": [{"id": "1", "name": "Test Node"}]}
        html_content = NotebookVisualizer.generate_html(mock_json)

        assert json.dumps(mock_json) in html_content
        assert json.dumps(DEFAULT_VIZ_OPTIONS) in html_content
        assert DEFAULT_JS_URL in html_content

    def test_wrap_in_iframe(self):
        mock_html_content = """<!DOCTYPE>"""
        iframed_html = NotebookVisualizer._wrap_in_iframe(mock_html_content)
        assert """<iframe""" in iframed_html

    def test_show(self, example_pipelines, mocker):
        visualizer = NotebookVisualizer(
            pipeline=example_pipelines, options={"theme": "light"}
        )
        custom_response = {"nodes": [{"id": "1", "name": "Test Node"}]}
        mock_load_viz_data = mocker.patch(
            "kedro_viz.launchers.notebook_visualizer.NotebookVisualizer._load_viz_data",
            return_value=custom_response,
        )
        mock_generate_html = mocker.patch(
            "kedro_viz.launchers.notebook_visualizer.NotebookVisualizer.generate_html",
            return_value="""<!DOCTYPE>""",
        )
        mock_wrap_in_iframe = mocker.patch(
            "kedro_viz.launchers.notebook_visualizer.NotebookVisualizer._wrap_in_iframe",
            return_value="""<iframe><!DOCTYPE></iframe>""",
        )
        mock_display = mocker.patch("kedro_viz.launchers.notebook_visualizer.display")

        visualizer.show()

        mock_load_viz_data.assert_called_once()
        mock_generate_html.assert_called_once_with(
            mock_load_viz_data.return_value, visualizer.options, visualizer.js_url
        )
        mock_wrap_in_iframe.assert_called_once_with(mock_generate_html.return_value)
        assert mock_display.called

    def test_show_exception_handling(self, example_pipelines):
        visualizer = NotebookVisualizer(pipeline=example_pipelines)

        with patch.object(
            visualizer, "_load_viz_data", side_effect=Exception("Test Error")
        ) as mock_load_data:
            with patch(
                "kedro_viz.launchers.notebook_visualizer.display"
            ) as mock_display:
                visualizer.show()
                mock_load_data.assert_called_once()
                mock_display.assert_called_once()
                error_message_html = mock_display.call_args[0][0]

                assert isinstance(error_message_html, HTML)
                assert "Error: Test Error" in error_message_html.data
