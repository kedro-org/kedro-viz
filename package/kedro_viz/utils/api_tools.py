import fsspec
from fastapi.encoders import jsonable_encoder
from kedro.io.core import get_protocol_and_path
from kedro_viz.data_access import data_access_manager
from kedro_viz.api.rest.responses import (
    get_default_response,
    get_node_metadata_response,
    get_selected_pipeline_response,
    EnhancedORJSONResponse)


def save_api_responses_to_fs(filepath: str):
    protocol, path = get_protocol_and_path(filepath)
    remote_fs = fsspec.filesystem(protocol)
    default_response = get_default_response()
    jsonable_default_response = jsonable_encoder(default_response)
    encoded_response = EnhancedORJSONResponse.encode_to_human_readable(
        jsonable_default_response
    )

    main_loc = f"{path}/api/main"
    nodes_loc = f"{path}/api/nodes"
    pipelines_loc = f"{path}/api/pipelines"

    if protocol == "file":
        remote_fs.makedirs(path, exist_ok=True)
        remote_fs.makedirs(nodes_loc, exist_ok=True)
        remote_fs.makedirs(pipelines_loc, exist_ok=True)

    with remote_fs.open(main_loc, "wb") as f:
        f.write(encoded_response)

    for node in data_access_manager.nodes.get_node_ids():
        node_response = get_node_metadata_response(node)
        jsonable_node_response = jsonable_encoder(node_response)
        encoded_response = EnhancedORJSONResponse.encode_to_human_readable(
            jsonable_node_response
        )
        with remote_fs.open(f"{nodes_loc}/{node}", "wb") as f:
            f.write(encoded_response)

    for pipeline in data_access_manager.registered_pipelines.get_pipeline_ids():
        pipeline_response = get_selected_pipeline_response(pipeline)
        jsonable_pipeline_response = jsonable_encoder(pipeline_response)
        encoded_response = EnhancedORJSONResponse.encode_to_human_readable(
            jsonable_pipeline_response
        )
        with remote_fs.open(f"{pipelines_loc}/{pipeline}", "wb") as f:
            f.write(encoded_response)
