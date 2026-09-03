"""Domain errors raised by project-scoped inspection services."""


class PipelineNotFoundError(ValueError):
    """Raised when a requested pipeline is not present in the inspection snapshot."""


class NodeNotFoundError(ValueError):
    """Raised when an ID has no supported node metadata in the inspection snapshot."""
