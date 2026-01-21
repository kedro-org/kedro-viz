"""Nodes for testing different preview types using Kedro preview contract."""

import base64

from kedro.pipeline.preview_contract import (
    ImagePreview,
    JsonPreview,
    MermaidPreview,
    PlotlyPreview,
    TablePreview,
    TextPreview,
)

def contextual_preview():
    pass

def make_preview_fn(data_sample):
    """Create a preview function with captured context."""
    def preview_fn() -> TablePreview:
        return TablePreview(content=data_sample)
    return preview_fn

from kedro.framework.session import KedroSession


def preview_with_data_access() -> TablePreview:
    """Preview function that loads data from catalog.

    Demonstrates using meta.limit to control preview size.
    Without meta.limit, backend defaults to 10 rows.
    With meta.limit=20, shows 20 rows (clamped to max of 50).
    """
    with KedroSession.create() as session:
        context = session.load_context()
        data = context.catalog.load("companies").to_dict(orient='records')

        # Example: Request 20 rows (will be clamped to 10-50 range by backend)
        return TablePreview(content=data, meta={"limit": 20})

def generate_text_preview() -> TextPreview:
    """Generate a simple text preview.

    Returns:
        TextPreview object with plain text content
    """
    content = """This is a plain text preview.

It can contain multiple lines of text.
Useful for displaying log outputs, reports, or any textual information.

Line 1: Sample data
Line 2: More information
Line 3: Additional details
This is a plain text preview.

It can contain multiple lines of text.
Useful for displaying log outputs, reports, or any textual information.

Line 1: Sample data
Line 2: More information
Line 3: Additional details
This is a plain text preview.

It can contain multiple lines of text.
Useful for displaying log outputs, reports, or any textual information.

Line 1: Sample data
Line 2: More information
Line 3: Additional details
This is a plain text preview.

It can contain multiple lines of text.
Useful for displaying log outputs, reports, or any textual information.

Line 1: Sample data
Line 2: More information
Line 3: Additional details
This is a plain text preview.

It can contain multiple lines of text.
Useful for displaying log outputs, reports, or any textual information.

Line 1: Sample data
Line 2: More information
Line 3: Additional details
This is a plain text preview.

It can contain multiple lines of text.
Useful for displaying log outputs, reports, or any textual information.

Line 1: Sample data
Line 2: More information
Line 3: Additional details"""

    return TextPreview(content=content)


def generate_code_preview() -> TextPreview:
    """Generate a code preview with syntax highlighting.

    Returns:
        TextPreview object with code content and language metadata
    """
    code = """def calculate_metrics(data):
    \"\"\"Calculate key performance metrics.\"\"\"
    import pandas as pd

    metrics = {
        'mean': data.mean(),
        'median': data.median(),
        'std': data.std()
    }

    return pd.DataFrame(metrics)

# Example usage
result = calculate_metrics(my_dataframe)
print(result)"""

    return TextPreview(content=code, meta={"language": "python"})


def generate_mermaid_preview() -> MermaidPreview:
    """Generate a Mermaid diagram preview with custom configuration.

    This example demonstrates how to customize both the Mermaid rendering
    configuration and the text styling for node labels.

    Returns:
        MermaidPreview object with diagram markup and custom config

    Example:
        Basic usage without configuration:
        >>> return MermaidPreview(content=diagram)

        With custom configuration:
        >>> config = {
        ...     "flowchart": {"wrappingWidth": 300},
        ...     "themeVariables": {"fontSize": "16px"},
        ...     "textStyle": {"padding": "8px", "lineHeight": "1.5"}
        ... }
        >>> return MermaidPreview(content=diagram, meta=config)
    """
    diagram = """graph TD
    A[Raw Data] -->|Ingest| B(Typed Data)
    B --> C{Quality Check}
    C -->|Pass| D[Clean Data]
    C -->|Fail| E[Error Log]
    D --> F[Feature Engineering]
    F --> G[Model Training]
    G --> H[Predictions]

    style A fill:#e1f5ff
    style D fill:#c8e6c9
    style E fill:#ffcdd2
    style H fill:#fff9c4"""

    # Optional: Customize Mermaid rendering configuration
    # This configuration is merged with sensible defaults
    custom_config = {
        "securityLevel": "strict",  # Security level: 'strict', 'loose', 'antiscript' (default: 'strict')
        "flowchart": {
            "wrappingWidth": 300,   # Text wrapping threshold (default: 250)
            "nodeSpacing": 60,      # Horizontal space between nodes (default: 50)
            "rankSpacing": 60,      # Vertical space between levels (default: 50)
            "curve": "basis",       # Edge curve style: 'basis', 'linear', 'step'
        },
        "themeVariables": {
            "fontSize": "16px",     # Font size for labels (default: '14px')
        },
        # CSS styling for text nodes (nested within config)
        "textStyle": {
            "padding": "6px",           # Internal padding in nodes (default: '4px')
            "lineHeight": "1.3",        # Line height for wrapped text (default: '1.2')
            "textAlign": "center",      # Text alignment (default: 'center')
            # Available options: whiteSpace, wordBreak, overflowWrap, overflow,
            # display, alignItems, justifyContent, width, height
        }
    }

    return MermaidPreview(content=diagram, meta=custom_config)




def generate_json_preview() -> JsonPreview:
    """Generate a JSON data preview.

    Returns:
        JsonPreview object with structured data
    """
    data = {
        "pipeline_info": {
            "name": "preview_tests",
            "version": "1.0.0",
            "description": "Testing preview renderers"
        },
        "metrics": {
            "accuracy": 0.95,
            "precision": 0.92,
            "recall": 0.89,
            "f1_score": 0.90
        },
        "dataset_stats": {
            "total_rows": 10000,
            "features": 25,
            "missing_values": 127,
            "duplicates": 5
        },
        "feature_importance": [
            {"feature": "age", "importance": 0.23},
            {"feature": "income", "importance": 0.19},
            {"feature": "credit_score", "importance": 0.17},
            {"feature": "employment_years", "importance": 0.15},
            {"feature": "debt_ratio", "importance": 0.12}
        ]
    }

    return JsonPreview(content=data)


def generate_table_preview() -> TablePreview:
    """Generate a table preview.

    Returns:
        TablePreview object with tabular data
    """
    table_data = [
        {"Model": "Random Forest", "Accuracy": "0.95", "Precision": "0.92", "Recall": "0.89", "F1 Score": "0.90"},
        {"Model": "Gradient Boosting", "Accuracy": "0.96", "Precision": "0.94", "Recall": "0.91", "F1 Score": "0.92"},
        {"Model": "Logistic Regression", "Accuracy": "0.87", "Precision": "0.85", "Recall": "0.83", "F1 Score": "0.84"},
        {"Model": "Neural Network", "Accuracy": "0.94", "Precision": "0.91", "Recall": "0.88", "F1 Score": "0.89"},
        {"Model": "SVM", "Accuracy": "0.89", "Precision": "0.87", "Recall": "0.85", "F1 Score": "0.86"},
        {"Model": "Decision Tree", "Accuracy": "0.82", "Precision": "0.80", "Recall": "0.78", "F1 Score": "0.79"},
        {"Model": "KNN", "Accuracy": "0.85", "Precision": "0.83", "Recall": "0.81", "F1 Score": "0.82"},
        {"Model": "Naive Bayes", "Accuracy": "0.79", "Precision": "0.77", "Recall": "0.75", "F1 Score": "0.76"}
    ]

    return TablePreview(content=table_data)


def generate_plotly_preview() -> PlotlyPreview:
    """Generate a Plotly chart preview.

    Returns:
        PlotlyPreview object with Plotly chart specification
    """
    plotly_spec = {
        "data": [
            {
                "x": ["Random Forest", "Gradient Boosting", "Logistic Regression",
                      "Neural Network", "SVM", "Decision Tree", "KNN", "Naive Bayes"],
                "y": [0.95, 0.96, 0.87, 0.94, 0.89, 0.82, 0.85, 0.79],
                "type": "bar",
                "name": "Accuracy",
                "marker": {"color": "#1f77b4"}
            },
            {
                "x": ["Random Forest", "Gradient Boosting", "Logistic Regression",
                      "Neural Network", "SVM", "Decision Tree", "KNN", "Naive Bayes"],
                "y": [0.92, 0.94, 0.85, 0.91, 0.87, 0.80, 0.83, 0.77],
                "type": "bar",
                "name": "Precision",
                "marker": {"color": "#ff7f0e"}
            }
        ],
        "layout": {
            "title": "Model Performance Comparison",
            "xaxis": {"title": "Model"},
            "yaxis": {"title": "Score"},
            "barmode": "group"
        }
    }

    return PlotlyPreview(content=plotly_spec)


def generate_image_preview() -> ImagePreview:
    """Generate a base64 encoded image preview.

    Returns:
        ImagePreview object with SVG image data
    """
    # Create a simple SVG image
    svg_content = """<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="300" fill="#f0f0f0"/>
  <circle cx="200" cy="150" r="80" fill="#4CAF50" opacity="0.7"/>
  <circle cx="160" cy="130" r="60" fill="#2196F3" opacity="0.7"/>
  <circle cx="240" cy="130" r="60" fill="#FF9800" opacity="0.7"/>
  <text x="200" y="250" font-family="Arial" font-size="20" text-anchor="middle" fill="#333">
    Preview Renderer Test
  </text>
</svg>"""

    # Convert to base64
    svg_bytes = svg_content.encode('utf-8')
    base64_svg = base64.b64encode(svg_bytes).decode('utf-8')
    data_uri = f"data:image/svg+xml;base64,{base64_svg}"

    return ImagePreview(content=data_uri)
