"""`kedro_viz.models.tag` defines data models to represent Kedro tags in a viz graph."""

from .model_utils import NamedEntity


class Tag(NamedEntity):
    """Represent a tag in a Kedro project."""

    def __hash__(self) -> int:
        return hash(self.id)
