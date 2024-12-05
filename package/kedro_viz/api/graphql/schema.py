"""`kedro_viz.api.graphql.schema` defines the GraphQL schema: queries and mutations."""

from __future__ import annotations

import logging
from packaging.version import parse

import strawberry
from strawberry.extensions import AddValidationRules
from strawberry.tools import merge_types
from graphql.validation import NoSchemaIntrospectionCustomRule

from kedro_viz import __version__
from kedro_viz.integrations.pypi import get_latest_version, is_running_outdated_version
from .types import Version

logger = logging.getLogger(__name__)

@strawberry.type
class VersionQuery:
    @strawberry.field(description="Get the installed and latest Kedro-Viz versions")
    def version(self) -> Version:
        installed_version = parse(__version__)
        latest_version = get_latest_version()
        return Version(
            installed=str(installed_version),
            is_outdated=is_running_outdated_version(installed_version, latest_version),
            latest=str(latest_version) or "",
        )

schema = strawberry.Schema(
    query=merge_types("Query", (VersionQuery,)),
    extensions=[
        AddValidationRules([NoSchemaIntrospectionCustomRule]),
    ],
)