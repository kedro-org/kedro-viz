"""`kedro_viz.models.flowchart.pipelines` represent Kedro pipelines in a viz graph."""

from .model_utils import NamedEntity


class RegisteredPipeline(NamedEntity):
    """Represent a registered pipeline in a Kedro project."""
