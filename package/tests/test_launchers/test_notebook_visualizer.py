import json
from kedro_viz.launchers.notebook_visualizer import NotebookVisualizer, DEFAULT_VIZ_OPTIONS

class TestNotebookVisualizer:
    def test_notebook_visualizer_init(self, example_pipelines, example_catalog):
        notebook_visualizer = NotebookVisualizer(example_pipelines, example_catalog)
        assert isinstance(notebook_visualizer, NotebookVisualizer)
        assert notebook_visualizer.pipeline == example_pipelines
        assert notebook_visualizer.catalog == example_catalog
        assert notebook_visualizer.options == DEFAULT_VIZ_OPTIONS

    def test_get_viz_data(self, example_pipelines, example_catalog, mocker):
        notebook_visualizer = NotebookVisualizer(example_pipelines, example_catalog)

        mock_load = mocker.patch("kedro_viz.launchers.notebook_visualizer.load_and_populate_data_for_notebook_users")
        mock_get_project_json = mocker.patch("kedro_viz.launchers.notebook_visualizer.get_kedro_project_json_data")

        notebook_visualizer.get_viz_data()

        mock_load.assert_called_once_with(notebook_visualizer.pipeline, notebook_visualizer.catalog)
        mock_get_project_json.assert_called_once()

    def test_get_html(self):
        mock_json = {"nodes": [{"id": "1", "name": "Test Node"}]}
        html_content = NotebookVisualizer.get_html(mock_json, DEFAULT_VIZ_OPTIONS)

        assert json.dumps(mock_json) in html_content
        assert json.dumps(DEFAULT_VIZ_OPTIONS) in html_content

    def test_embed_html(self):
       mock_html_content = """<!DOCTYPE>"""
       iframed_html = NotebookVisualizer.embed_html(mock_html_content)
       assert """<iframe""" in iframed_html

    def test_show(self, example_pipelines, mocker):
        visualizer = NotebookVisualizer(example_pipelines, None, options={"theme": "light"})
        custom_response = {"nodes": [{"id": "1", "name": "Test Node"}]}
        mock_get_viz_data = mocker.patch("kedro_viz.launchers.notebook_visualizer.NotebookVisualizer.get_viz_data", return_value=custom_response)
        mock_get_html = mocker.patch("kedro_viz.launchers.notebook_visualizer.NotebookVisualizer.get_html", return_value="""<!DOCTYPE>""")
        mock_embed_html = mocker.patch("kedro_viz.launchers.notebook_visualizer.NotebookVisualizer.embed_html", return_value="""<iframe><!DOCTYPE></iframe>""")
        mock_display = mocker.patch("kedro_viz.launchers.notebook_visualizer.display")

        visualizer.show()

        mock_get_viz_data.assert_called_once()
        mock_get_html.assert_called_once_with(mock_get_viz_data.return_value, visualizer.options)
        mock_embed_html.assert_called_once_with(mock_get_html.return_value)
        assert mock_display.called
