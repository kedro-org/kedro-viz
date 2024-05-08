from kedro.pipeline import Pipeline, node
from kedro.pipeline.modular_pipeline import pipeline

def _get_generic_pipe() -> Pipeline:
    return Pipeline([
        node(
            func=lambda x: x,
            inputs="input_df",
            outputs="output_df",
        ),
    ])


def create_pipeline(**kwargs) -> Pipeline:
    pipe = Pipeline([
        pipeline(
            pipe=_get_generic_pipe(),
            inputs={"input_df": "input_to_processing"},
            outputs={"output_df": "post_first_pipe"},
            namespace="first_processing_step",
        ),
        pipeline(
            pipe=_get_generic_pipe(),
            inputs={"input_df": "post_first_pipe"},
            outputs={"output_df": "output_from_processing"},
            namespace="second_processing_step",
        ),
    ])
    return pipeline(
        pipe=pipe,
        inputs="input_to_processing",
        outputs="output_from_processing",
        namespace="processing",
    )