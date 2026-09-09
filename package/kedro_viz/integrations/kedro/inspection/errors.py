"""Domain errors raised by project-scoped inspection services."""


class PipelineNotFoundError(ValueError):
    """Raised when a requested pipeline is not present in the inspection snapshot."""


class NodeNotFoundError(ValueError):
    """Raised when a requested node has no supported metadata in the inspection snapshot."""
