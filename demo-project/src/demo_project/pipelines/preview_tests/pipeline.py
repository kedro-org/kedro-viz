"""Pipeline for testing all preview renderer types."""

from kedro.pipeline import Pipeline, node, pipeline

from .nodes import (
    contextual_preview,
    generate_code_preview,
    generate_image_preview,
    generate_json_preview,
    generate_mermaid_preview,
    generate_plotly_preview,
    generate_table_preview,
    generate_text_preview,
    preview_with_data_access,
)


def create_pipeline(**kwargs) -> Pipeline:
    """Create a pipeline to test all preview renderers.

    This pipeline generates preview outputs for each supported preview type:
    - TextPreview (plain text and code)
    - MermaidPreview (diagrams and flowcharts)
    - JsonPreview (structured data)
    - TablePreview (tabular data)
    - PlotlyPreview (charts)
    - ImagePreview (images)

    Returns:
        Pipeline: A set of nodes that generate different preview types
    """
    sample_data = [{"id": 1, "value": 100}, {"id": 2, "value": 200}]
    return pipeline(
        [
            node(
                func=generate_text_preview,
                inputs=None,
                outputs="text_preview",
                name="generate_text_preview",
                preview_fn=generate_text_preview
            ),
            node(
                func=generate_code_preview,
                inputs=None,
                outputs="code_preview",
                name="generate_code_preview",
                preview_fn=generate_code_preview
            ),
            node(
                func=generate_mermaid_preview,
                inputs=None,
                outputs="mermaid_diagram_preview",
                name="generate_mermaid_diagram",
                preview_fn=generate_mermaid_preview,
            ),
            node(
                func=generate_json_preview,
                inputs=None,
                outputs="json_preview",
                name="generate_json_preview",
                preview_fn=generate_json_preview,
            ),
            node(
                func=generate_table_preview,
                inputs=None,
                outputs="table_preview",
                name="generate_table_preview",
                preview_fn=generate_table_preview,
            ),
            node(
                func=generate_plotly_preview,
                inputs=None,
                outputs="plotly_preview",
                name="generate_plotly_preview",
                preview_fn=generate_plotly_preview,
            ),
            node(
                func=generate_image_preview,
                inputs=None,
                outputs="image_preview",
                name="generate_image_preview",
                preview_fn=generate_image_preview,
            ),
            node(
                func=contextual_preview,
                inputs=None,
                outputs="context_json_preview",
                name="generate_contextual_preview",
                preview_fn=preview_with_data_access,
            ),
        ],
        namespace="preview_tests",
    )
