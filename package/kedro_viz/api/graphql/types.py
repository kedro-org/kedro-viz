"""`kedro_viz.api.graphql.types` defines strawberry types."""

from __future__ import annotations

import strawberry

@strawberry.type(description="Installed and latest Kedro-Viz versions")
class Version:
    installed: str
    is_outdated: bool
    latest: str