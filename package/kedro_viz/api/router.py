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
"""`kedro_viz.api.router` defines routes and handling logic for the API."""
# pylint: disable=missing-function-docstring
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from kedro_viz.data_access import data_access_manager
from kedro_viz.models.graph import (
    DataNode,
    DataNodeMetadata,
    ParametersNodeMetadata,
    TaskNode,
    TaskNodeMetadata,
)

from .responses import (
    APIErrorMessage,
    GraphAPIResponse,
    NodeMetadataAPIResponse,
    get_default_response,
)

router = APIRouter(
    prefix="/api",
    responses={404: {"model": APIErrorMessage}},
)


@router.get("/main", response_model=GraphAPIResponse)
async def main():
    return get_default_response()


@router.get(
    "/nodes/{node_id}",
    response_model=NodeMetadataAPIResponse,  # type: ignore
    response_model_exclude_none=True,
)
async def get_single_node_metadata(node_id: str):
    node = data_access_manager.nodes.get_node_by_id(node_id)
    if not node:
        return JSONResponse(status_code=404, content={"message": "Invalid node ID"})

    if not node.has_metadata():
        return JSONResponse(content={})

    if isinstance(node, TaskNode):
        return TaskNodeMetadata(node)

    if isinstance(node, DataNode):
        return DataNodeMetadata(node)

    return ParametersNodeMetadata(node)


@router.get(
    "/pipelines/{pipeline_id}",
    response_model=GraphAPIResponse,
)
async def get_single_pipeline_data(pipeline_id: str):
    if not data_access_manager.registered_pipelines.has_pipeline(pipeline_id):
        return JSONResponse(status_code=404, content={"message": "Invalid pipeline ID"})

    node_ids = data_access_manager.registered_pipelines.get_node_ids_by_pipeline_id(
        pipeline_id
    )
    nodes = data_access_manager.nodes.get_nodes_by_ids(node_ids)

    return GraphAPIResponse(
        nodes=nodes,
        edges=data_access_manager.edges.get_edges_by_node_ids(node_ids),
        tags=data_access_manager.tags.as_list(),
        layers=data_access_manager.layers.as_list(),
        pipelines=data_access_manager.registered_pipelines.as_list(),
        selected_pipeline=pipeline_id,
        modular_pipelines=data_access_manager.modular_pipelines.from_nodes(
            nodes
        ).as_list(),
    )
