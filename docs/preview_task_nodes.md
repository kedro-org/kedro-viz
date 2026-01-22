<!-- vale off -->
# Preview TaskNodes in Kedro-Viz
<!-- vale on -->

!!! warning
    This functionality is experimental and may change or be removed in future releases. Experimental features follow the process described in  [`docs/about/experimental.md`](https://docs.kedro.org/en/stable/about/experimental/).


This page describes how to add preview functions to your Kedro nodes (TaskNodes) to display helpful debugging information and visualisations in Kedro-Viz.

Starting from Kedro 1.2.0 and Kedro-Viz 12.3.0, you can attach preview functions to nodes using the `preview_fn` parameter. These preview functions return lightweight summaries, diagrams, or visualizations that help you understand what a node is doing without running the full pipeline.

<!-- vale off -->
## What are TaskNode previews?
<!-- vale on -->

TaskNode previews allow you to attach a preview function to any node in your pipeline. When you click on a TaskNode in Kedro-Viz, the preview appears in the metadata panel, in the same way as dataset previews.

Preview functions are:

- **Lightweight**: They should be fast and return small payloads
- **Independent**: They don't have direct access to node inputs/outputs
- **Flexible**: They can return text, diagrams, images, or structured data

!!! info
    For detailed information on how to create preview functions in Kedro, see the [Kedro documentation on preview functions](https://docs.kedro.org/en/stable/build/nodes.html#how-to-add-preview-functions-to-nodes).

## Supported preview types in Kedro-Viz
<!-- vale off -->
As of now, Kedro-Viz supports three preview types for TaskNodes:

1. **MermaidPreview**: Display flowcharts, sequence diagrams, and other Mermaid visualizations
2. **TextPreview**: Display text summaries, logs, or formatted code
3. **ImagePreview**: Display images using URLs or base64-encoded data URIs

<!-- vale on -->

## How to add a preview function to a node

To add a preview to a TaskNode, use the `preview_fn` parameter when creating the node:

```python
from kedro.pipeline import node
from kedro.pipeline.preview_contract import MermaidPreview

def preview_training_model() -> MermaidPreview:
    return MermaidPreview(
        content="""
        flowchart TD
            A[Load Training Data] --> B[Preprocess]
            B --> C[Train Model]
            C --> D[Validate]
            D --> E[Save Metrics]
        """
    )

node(
    func=train_model,
    inputs="training_data",
    outputs="model_metrics",
    preview_fn=preview_training_model,
    name="train_model_node",
)
```

## MermaidPreview examples

MermaidPreview is useful for visualizing workflows, architectures, and processes within your nodes.

### Basic flowchart example

```python
from kedro.pipeline import node
from kedro.pipeline.preview_contract import MermaidPreview

def generate_mermaid_preview() -> MermaidPreview:
    """Generate a Mermaid diagram preview."""
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

    return MermaidPreview(content=diagram)

node(
    func=process_data,
    inputs="raw_data",
    outputs="processed_data",
    preview_fn=generate_mermaid_preview,
    name="data_processing_node",
)
```

### Configuring Mermaid rendering

You can customize how Mermaid diagrams are rendered by providing a configuration object in the `meta` parameter. This allows you to control layout, styling, text wrapping, and other rendering options.

```python
from kedro.pipeline import node
from kedro.pipeline.preview_contract import MermaidPreview

def generate_mermaid_preview() -> MermaidPreview:
    """Generate a Mermaid diagram with custom configuration.

    This example demonstrates how to customize both the Mermaid rendering
    configuration and the text styling for node labels.
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
        "securityLevel": "strict",  # Security level: 'strict', 'loose', 'antiscript'
        "flowchart": {
            "wrappingWidth": 300,   # Text wrapping threshold (default: 250)
            "nodeSpacing": 60,      # Horizontal space between nodes (default: 50)
            "rankSpacing": 60,      # Vertical space between levels (default: 50)
            "curve": "basis",       # Edge curve style: 'basis', 'linear', 'step'
        },
        "themeVariables": {
            "fontSize": "16px",     # Font size for labels (default: '14px')
        },
        # CSS styling for text nodes
        "textStyle": {
            "padding": "6px",           # Internal padding in nodes (default: '4px')
            "lineHeight": "1.3",        # Line height for wrapped text (default: '1.2')
            "textAlign": "center",      # Text alignment (default: 'center')
        }
    }

    return MermaidPreview(content=diagram, meta=custom_config)

node(
    func=process_data,
    inputs="raw_data",
    outputs="processed_data",
    preview_fn=generate_mermaid_preview,
    name="data_processing_node",
)
```

#### Available Mermaid configuration options

The `meta` parameter accepts the following configuration options. All values shown are the defaults that Kedro-Viz uses:

**Security options**:

- `securityLevel`: Security level (default: `'strict'`)
  - Options: `'strict'`, `'loose'`, `'antiscript'`

**Font options**:

- `fontFamily`: Font family for the diagram (default: `'ui-sans-serif, system-ui, sans-serif'`)

**Flowchart options** (`flowchart` key):

- `htmlLabels`: Enable HTML in labels (default: `true`)
- `curve`: Edge curve style (default: `'basis'`)
  - Options: `'basis'`, `'linear'`, `'step'`
- `wrappingWidth`: Text wrapping threshold in pixels (default: `250`)
- `useMaxWidth`: Use maximum width available (default: `true`)
- `nodeSpacing`: Horizontal space between nodes in pixels (default: `50`)
- `rankSpacing`: Vertical space between levels in pixels (default: `50`)

**Theme options** (`themeVariables` key):

- `fontSize`: Font size for labels (default: `'14px'`)
- Other Mermaid theme variables as needed

**Text styling options** (`textStyle` key):

- `whiteSpace`: CSS white-space property (default: `'normal'`)
- `wordBreak`: CSS word-break property (default: `'normal'`)
- `overflowWrap`: CSS overflow-wrap property (default: `'normal'`)
- `overflow`: CSS overflow property (default: `'visible'`)
- `display`: CSS display property (default: `'flex'`)
- `alignItems`: CSS align-items property (default: `'center'`)
- `justifyContent`: CSS justify-content property (default: `'center'`)
- `textAlign`: Text alignment (default: `'center'`)
- `width`: CSS width property (default: `'100%'`)
- `height`: CSS height property (default: `'100%'`)
- `padding`: Internal padding in nodes (default: `'4px'`)
- `lineHeight`: Line height for wrapped text (default: `'1.2'`)

!!! tip
    Learn more about Mermaid syntax and diagram types at [mermaid.js.org](https://mermaid.js.org/).

## TextPreview examples

TextPreview is useful for displaying configuration details, summaries, or documentation.

### Simple text preview

```python
from kedro.pipeline import node
from kedro.pipeline.preview_contract import TextPreview

def generate_text_preview() -> TextPreview:
    """Generate a simple text preview."""
    content = """This is a plain text preview.

It can contain multiple lines of text.
Useful for displaying log outputs, reports, or any textual information.

Line 1: Sample data
Line 2: More information
Line 3: Additional details"""

    return TextPreview(content=content)

node(
    func=process_logs,
    inputs="raw_logs",
    outputs="processed_logs",
    preview_fn=generate_text_preview,
    name="log_processing_node",
)
```

### Code preview with syntax highlighting

You can display code snippets with syntax highlighting by specifying the language in the `meta` parameter:

```python
from kedro.pipeline import node
from kedro.pipeline.preview_contract import TextPreview

def generate_code_preview() -> TextPreview:
    """Generate a code preview with syntax highlighting."""
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

node(
    func=calculate_metrics,
    inputs="data",
    outputs="metrics",
    preview_fn=generate_code_preview,
    name="metrics_calculation_node",
)
```

The `meta` parameter accepts a `language` key to specify the programming language for syntax highlighting. Supported languages include `python`, `javascript`, `sql`, `yaml`, `json`, and others.

## ImagePreview examples

ImagePreview is useful for displaying static images, charts, or diagrams. You can provide either a URL or a base64-encoded data URI.

### Using a base64-encoded SVG image

```python
import base64
from kedro.pipeline import node
from kedro.pipeline.preview_contract import ImagePreview

def generate_image_preview() -> ImagePreview:
    """Generate a base64 encoded image preview."""
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

node(
    func=generate_visualization,
    inputs="data",
    outputs="visualization",
    preview_fn=generate_image_preview,
    name="visualization_node",
)
```

### Using a PNG image with base64 encoding

```python
import base64
from kedro.pipeline import node
from kedro.pipeline.preview_contract import ImagePreview

def preview_sample_output() -> ImagePreview:
    """Generate a preview from a PNG file."""
    # Read and encode image file
    with open("data/sample_output.png", "rb") as image_file:
        encoded = base64.b64encode(image_file.read()).decode()

    return ImagePreview(
        content=f"data:image/png;base64,{encoded}"
    )

node(
    func=generate_output,
    inputs="input_data",
    outputs="output_data",
    preview_fn=preview_sample_output,
    name="output_generator_node",
)
```

### Using an image URL

```python
from kedro.pipeline import node
from kedro.pipeline.preview_contract import ImagePreview

def preview_model_architecture() -> ImagePreview:
    """Generate a preview from an external image URL."""
    return ImagePreview(
        content="https://example.com/model_architecture.png"
    )

node(
    func=build_model,
    inputs="model_config",
    outputs="model",
    preview_fn=preview_model_architecture,
    name="model_builder_node",
)
```

!!! warning
    Keep image sizes small for better performance. Large base64-encoded images can slow down Kedro-Viz.

## Using closures to capture context

Preview functions don't have direct access to node inputs or outputs, but you can use closures to capture context during pipeline creation:

```python
from kedro.pipeline import node, pipeline
from kedro.pipeline.preview_contract import TextPreview

def create_pipeline(**kwargs) -> pipeline:
    # Configuration known at pipeline creation time
    model_type = "RandomForest"
    n_estimators = 100

    def preview_with_context() -> TextPreview:
        return TextPreview(
            content=f"""
            Model: {model_type}
            Estimators: {n_estimators}

            This node trains a {model_type} model
            with {n_estimators} estimators.
            """
        )

    return pipeline([
        node(
            func=train_model,
            inputs="training_data",
            outputs="model",
            preview_fn=preview_with_context,
            name="train_model_node",
        )
    ])
```

## Viewing TaskNode previews in Kedro-Viz

![Mermaid preview of a task node](./images/task-node-preview.png)

After adding preview functions to your nodes:

1. Run `kedro viz` to start Kedro-Viz
2. Click on any TaskNode that has a preview function
3. The preview will appear in the metadata panel on the right side
4. For MermaidPreview, you'll see an interactive diagram
5. For TextPreview, you'll see formatted text (with code block support)
6. For ImagePreview, you'll see the image inline

!!! tip
    TaskNode previews work alongside dataset previews. You can use both to get a complete view of your pipeline's behavior.

## Best practices

When creating preview functions for TaskNodes:

- **Keep them lightweight**: Preview functions should return responses with minimal latency.
- **Make them informative**: Use previews to explain what a node does or its configuration
- **Use appropriate types**: Choose the preview type that best communicates your information
- **Don't duplicate information**: If information is already in parameters or metadata, you don't need it in the preview
- **Consider maintenance**: Preview functions should not be complex to update when node logic changes

## Differences from dataset previews

TaskNode previews differ from dataset previews in several ways:

| Aspect | Dataset Previews | TaskNode Previews |
|--------|------------------|-------------------|
| **What they show** | Actual data content | Node behavior/configuration |
| **When they run** | After data is loaded | Defined at pipeline creation |
| **Access to data** | Full dataset access | No direct access to inputs/outputs |
| **Primary use case** | Inspect data quality | Understand node logic |
| **Enabled by default** | Yes (since Kedro-Viz 8.0.0) | When `preview_fn` is provided |

## Additional preview types

While Kedro-Viz supports MermaidPreview, TextPreview, and ImagePreview for TaskNodes, Kedro itself supports additional preview types:

- **JsonPreview**: For structured metadata
- **TablePreview**: For tabular data samples
- **PlotlyPreview**: For interactive charts
- **CustomPreview**: For specialised rendering

Support for these additional preview types in Kedro-Viz may be added in future releases.

!!! info
    For the complete list of preview types and their specifications, see the [Kedro documentation on preview types](https://docs.kedro.org/en/stable/build/nodes.html#how-to-add-preview-functions-to-nodes).
