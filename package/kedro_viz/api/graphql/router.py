"""`kedro_viz.api.graphql.router` defines GraphQL routes."""
from fastapi import APIRouter
from strawberry.asgi import GraphQL

from .schema import schema

router = APIRouter()

graphql_app = GraphQL(schema)
router.add_route("/graphql", graphql_app)
router.add_websocket_route("/graphql", graphql_app)
