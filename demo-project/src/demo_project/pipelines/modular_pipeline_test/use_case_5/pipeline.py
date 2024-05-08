from kedro.pipeline import Pipeline, node
from kedro.pipeline.modular_pipeline import pipeline

def create_pipeline(**kwargs) -> Pipeline:
    data_processing_pipeline = pipeline(
        [
            node(
                lambda x: x,
                inputs=["raw_data"],
                outputs="model_inputs",
                name="process_data",
                tags=["split"],
            )
        ],
        namespace="uk.data_processing",
        outputs="model_inputs",
    )
    data_science_pipeline = pipeline(
        [
            node(
                lambda x: x,
                inputs=["model_inputs"],
                outputs="model",
                name="train_model",
                tags=["train"],
            )
        ],
        namespace="uk.data_science",
        inputs="model_inputs",
    )
    return data_processing_pipeline + data_science_pipeline