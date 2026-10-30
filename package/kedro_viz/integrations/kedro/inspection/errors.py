"""Domain errors raised by project-scoped inspection services."""


class PipelineNotFoundError(ValueError):
    """Raised when a requested pipeline is not present in the inspection snapshot."""
