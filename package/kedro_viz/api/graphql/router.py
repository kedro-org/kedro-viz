"""`kedro_viz.api.graphql.router` defines GraphQL routes."""

# mypy: ignore-errors
from fastapi import APIRouter
from strawberry.asgi import GraphQL

from .schema import schema

router = APIRouter()

# graphiql=False can be removed if you wish to use the graphiql playground locally
graphql_app: GraphQL = GraphQL(schema, graphiql=False)
router.add_route("/graphql", graphql_app)
router.add_websocket_route("/graphql", graphql_app)

# {subpath:path} is to handle urls with subpath e.g. demo.kedro.org/web
router.add_route("/{subpath:path}/graphql", graphql_app)
router.add_websocket_route("/{subpath:path}/graphql", graphql_app)
