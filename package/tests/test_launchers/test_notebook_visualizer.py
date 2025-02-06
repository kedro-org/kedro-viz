from kedro_viz.launchers.notebook_visualizer import NotebookVisualizer
from kedro_viz.utils import NotebookUser


class TestNotebookVisualizer:
    def test_show_initializes_notebook_user(self, example_pipelines, mocker):
        visualizer = NotebookVisualizer()
        custom_response = {"nodes": [{"id": "1", "name": "Test Node"}]}
        mock_load = mocker.patch(
            "kedro_viz.launchers.notebook_visualizer.load_and_populate_data_for_notebook_users"
        )
        mocker.patch(
            "kedro_viz.launchers.notebook_visualizer.get_kedro_project_json_data",
            return_value=custom_response,
        )
        mock_display = mocker.patch("kedro_viz.launchers.notebook_visualizer.display")

        visualizer.show(example_pipelines, None, options={"theme": "light"})

        # Assert NotebookUser instance was created
        mock_load.assert_called_once()
        notebook_user = mock_load.call_args[0][0]
        assert isinstance(notebook_user, NotebookUser)
        assert notebook_user.pipeline == example_pipelines
        assert notebook_user.catalog is None
        assert notebook_user.options["theme"] == "light"

        # Verify JSON data fetch
        assert mock_display.called

    def test_show_generates_unique_html_ids(self, example_pipelines, mocker):
        visualizer = NotebookVisualizer()
        custom_response = {"nodes": [{"id": "1", "name": "Test Node"}]}
        mocker.patch(
            "kedro_viz.launchers.notebook_visualizer.load_and_populate_data_for_notebook_users"
        )
        mock_display = mocker.patch("kedro_viz.launchers.notebook_visualizer.display")
        mocker.patch(
            "kedro_viz.launchers.notebook_visualizer.get_kedro_project_json_data",
            return_value=custom_response,
        )

        visualizer.show(example_pipelines)

        # Check iframe content generation
        html_content = mock_display.call_args[0][0].data
        assert "iframe" in html_content
        assert 'sandbox="allow-scripts"' in html_content
        assert "kedro-viz-" in html_content
