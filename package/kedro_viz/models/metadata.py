"""`kedro_viz.models.metadata` defines metadata for Kedro-Viz application."""

from typing import Any, ClassVar, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class PackageCompatibility(BaseModel):
    """Represent package compatibility in app metadata"""

    package_name: str
    package_version: str
    is_compatible: bool

    @field_validator("package_name")
    @classmethod
    def set_package_name(cls, value):
        assert isinstance(value, str)
        return value

    @field_validator("package_version")
    @classmethod
    def set_package_version(cls, value):
        assert isinstance(value, str)
        return value

    @field_validator("is_compatible")
    @classmethod
    def set_is_compatible(cls, value):
        assert isinstance(value, bool)
        return value


class Metadata(BaseModel):
    """Represent Kedro-Viz application metadata"""

    has_missing_dependencies: ClassVar[bool] = False
    package_compatibilities: ClassVar[List[PackageCompatibility]] = []

    @classmethod
    def set_package_compatibilities(cls, value: List[PackageCompatibility]):
        cls.package_compatibilities = value

    @classmethod
    def set_has_missing_dependencies(cls, value: bool):
        cls.has_missing_dependencies = value


class NodeExtras(BaseModel):
    """Extra visualization properties for graph nodes.

    This class contains additional properties that are only needed for kedro-viz
    visualization and not part of core Kedro functionality.
    """

    stats: Optional[Dict[str, Any]] = Field(
        None,
        description="Dataset statistics like rows, columns, file_size (primarily for DataNode)",
    )

    styles: Optional[Dict[str, Any]] = Field(
        None,
        description="Node styling properties like fill, stroke, color (for all GraphNodes)",
    )

    def has_any_extras(self) -> bool:
        """Check if this object contains any non-None values."""
        return any([self.stats, self.styles])

    def get_stats_for_data_node(self) -> Dict[str, Any]:
        """Get stats specifically for DataNode types."""
        return self.stats or {}

    def get_styles_for_graph_node(self) -> Dict[str, Any]:
        """Get styles for any GraphNode type."""
        return self.styles or {}

    @classmethod
    def create_node_extras(
        cls,
        stats: Optional[Dict[str, Any]] = None,
        styles: Optional[Dict[str, Any]] = None,
    ) -> Optional["NodeExtras"]:
        """Create NodeExtras object from individual components.

        Args:
            stats: Dataset statistics dictionary
            styles: Node styling properties dictionary

        Returns:
            NodeExtras object or None if no extras provided
        """
        extras_obj = cls(
            stats=stats,
            styles=styles,
        )

        return extras_obj if extras_obj.has_any_extras() else None
