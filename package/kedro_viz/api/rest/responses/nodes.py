"""`kedro_viz.api.rest.responses.nodes` contains response classes
and utility functions for the `/nodes/*` REST endpoints"""

# pylint: disable=missing-class-docstring,invalid-name

import logging
from typing import Dict, List, Optional, Union

from fastapi.responses import JSONResponse
from pydantic import ConfigDict

from kedro_viz.api.rest.responses.base import BaseAPIResponse
from kedro_viz.data_access import data_access_manager
from kedro_viz.models.flowchart import (
    DataNode,
    DataNodeMetadata,
    ParametersNodeMetadata,
    TaskNode,
    TaskNodeMetadata,
    TranscodedDataNode,
    TranscodedDataNodeMetadata,
)

logger = logging.getLogger(__name__)


class TaskNodeMetadataAPIResponse(BaseAPIResponse):
    code: Optional[str] = None
    filepath: Optional[str] = None
    parameters: Optional[Dict] = None
    inputs: List[str]
    outputs: List[str]
    run_command: Optional[str] = None
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "code": "def split_data(data: pd.DataFrame, parameters: Dict) -> Tuple:",
                "filepath": "proj/src/new_kedro_project/pipelines/data_science/nodes.py",
                "parameters": {"test_size": 0.2},
                "inputs": ["params:input1", "input2"],
                "outputs": ["output1"],
                "run_command": "kedro run --to-nodes=split_data",
            }
        }
    )


class DataNodeMetadataAPIResponse(BaseAPIResponse):
    filepath: Optional[str] = None
    type: str
    run_command: Optional[str] = None
    preview: Optional[Union[Dict, str]] = None
    preview_type: Optional[str] = None
    stats: Optional[Dict] = None
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "filepath": "/my-kedro-project/data/03_primary/master_table.csv",
                "type": "kedro_datasets.pandas.csv_dataset.CSVDataset",
                "run_command": "kedro run --to-outputs=master_table",
            }
        }
    )


class TranscodedDataNodeMetadataAPIReponse(BaseAPIResponse):
    filepath: Optional[str] = None
    original_type: str
    transcoded_types: List[str]
    run_command: Optional[str] = None
    stats: Optional[Dict] = None


class ParametersNodeMetadataAPIResponse(BaseAPIResponse):
    parameters: Dict
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "parameters": {
                    "test_size": 0.2,
                    "random_state": 3,
                    "features": [
                        "engines",
                        "passenger_capacity",
                        "crew",
                        "d_check_complete",
                        "moon_clearance_complete",
                        "iata_approved",
                        "company_rating",
                        "review_scores_rating",
                    ],
                }
            }
        }
    )


NodeMetadataAPIResponse = Union[
    TaskNodeMetadataAPIResponse,
    DataNodeMetadataAPIResponse,
    TranscodedDataNodeMetadataAPIReponse,
    ParametersNodeMetadataAPIResponse,
]


def get_node_metadata_response(node_id: str):
    """API response for `/api/nodes/node_id`."""
    node = data_access_manager.nodes.get_node_by_id(node_id)
    if not node:
        return JSONResponse(status_code=404, content={"message": "Invalid node ID"})

    if not node.has_metadata():
        return JSONResponse(content={})

    if isinstance(node, TaskNode):
        return TaskNodeMetadata(task_node=node)

    if isinstance(node, DataNode):
        return DataNodeMetadata(data_node=node)

    if isinstance(node, TranscodedDataNode):
        return TranscodedDataNodeMetadata(transcoded_data_node=node)

    return ParametersNodeMetadata(parameters_node=node)
