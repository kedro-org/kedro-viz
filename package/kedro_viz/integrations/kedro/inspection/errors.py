"""Domain errors raised by project-scoped inspection services."""


class PipelineNotFoundError(ValueError):
    """Raised when a requested pipeline is not present in the inspection snapshot."""


class NodeNotFoundError(ValueError):
    """Raised when a requested node ID is absent from the inspection snapshot."""


class NodeMetadataNotAvailableError(ValueError):
    """Raised when a known graph node does not expose node metadata."""
