"""`kedro_viz.api.rest.responses.nodes` contains response classes
and utility functions for the `/nodes/*` REST endpoints"""

import logging
from typing import Dict, List, Optional, Union

from fastapi.responses import JSONResponse
from pydantic import ConfigDict

from kedro_viz.api.rest.responses.base import BaseAPIResponse
from kedro_viz.data_access import data_access_manager
from kedro_viz.models.flowchart.node_metadata import (
    DataNodeMetadata,
    ParametersNodeMetadata,
    TaskNodeMetadata,
    TranscodedDataNodeMetadata,
)
from kedro_viz.models.flowchart.nodes import DataNode, TaskNode, TranscodedDataNode

logger = logging.getLogger(__name__)


class TaskNodeMetadataAPIResponse(BaseAPIResponse):
    """
    TaskNodeMetadataAPIResponse is a data model for representing the metadata of a task node in the Kedro visualization API.

    Attributes:
        code (Optional[str]): The code snippet of the task node.
        filepath (Optional[str]): The file path where the task node is defined.
        parameters (Optional[Dict]): The parameters used by the task node.
        inputs (List[str]): The list of input data for the task node.
        outputs (List[str]): The list of output data from the task node.
        run_command (Optional[str]): The command to run the task node.
    """

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
    """
    DataNodeMetadataAPIResponse is a class that represents the metadata response for a data node in the Kedro visualization API.

    Attributes:
        filepath (Optional[str]): The file path of the data node.
        type (str): The type of the data node.
        run_command (Optional[str]): The command to run the data node.
        preview (Optional[Union[Dict, str]]): A preview of the data node's content.
        preview_type (Optional[str]): The type of the preview.
        stats (Optional[Dict]): Statistics related to the data node.
    """

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
    """
    TranscodedDataNodeMetadataAPIReponse represents the metadata response for a transcoded data node.

    Attributes:
        filepath (Optional[str]): The file path of the transcoded data node.
        original_type (str): The original type of the data node.
        transcoded_types (List[str]): A list of types to which the data node has been transcoded.
        run_command (Optional[str]): The command used to run the transcoding process.
        stats (Optional[Dict]): Statistics related to the transcoded data node.
    """

    filepath: Optional[str] = None
    original_type: str
    transcoded_types: List[str]
    run_command: Optional[str] = None
    stats: Optional[Dict] = None


class ParametersNodeMetadataAPIResponse(BaseAPIResponse):
    """
    ParametersNodeMetadataAPIResponse is a subclass of BaseAPIResponse that represents the metadata response for parameters nodes.

    Attributes:
        parameters (Dict): A dictionary containing the parameters.
    """

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
