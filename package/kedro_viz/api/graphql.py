# Copyright 2021 QuantumBlack Visual Analytics Limited
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
# OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
# NONINFRINGEMENT. IN NO EVENT WILL THE LICENSOR OR OTHER CONTRIBUTORS
# BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN
# ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF, OR IN
# CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
#
# The QuantumBlack Visual Analytics Limited ("QuantumBlack") name and logo
# (either separately or in combination, "QuantumBlack Trademarks") are
# trademarks of QuantumBlack. The License does not grant you any right or
# license to the QuantumBlack Trademarks. You may not use the QuantumBlack
# Trademarks or any confusingly similar mark as a trademark for your product,
# or use the QuantumBlack Trademarks in any other manner that might cause
# confusion in the marketplace, including but not limited to in advertising,
# on websites, or on software.
#
# See the License for the specific language governing permissions and
# limitations under the License.
"""`kedro_viz.api.graphql` defines graphql API endpoint."""
import strawberry

# pylint: disable=missing-class-docstring
# pylint: disable=missing-function-docstring
# pylint: disable=unused-argument
import typing

import strawberry
from fastapi import APIRouter
from strawberry.asgi import GraphQL

from kedro_viz.database import create_db_engine
from kedro_viz.models.session import Base, KedroSession


def get_db():
    engine, session_class = create_db_engine()
    Base.metadata.create_all(bind=engine)
    db = session_class()
    try:
        yield db
    finally:
        db.close()


@strawberry.type
class KedroSessionGraphQLType:
    id: str
    blob: str


def get_all_sessions() -> typing.List[KedroSessionGraphQLType]:
    db = next(get_db())
    return [
        KedroSessionGraphQLType(id=kedro_session.id, blob=kedro_session.blob)
        for kedro_session in db.query(KedroSession).all()
    ]


@strawberry.type
class Query:
    sessions: typing.List[KedroSessionGraphQLType] = strawberry.field(
        resolver=get_all_sessions
    )

router = APIRouter()

schema = strawberry.Schema(query=Query)
router.add_route("/graphql", GraphQL(schema))
