"""Project pipelines."""
from typing import Dict

from kedro.pipeline import Pipeline, node, pipeline

from demo_project.pipelines import data_ingestion as di
from demo_project.pipelines import feature_engineering as fe
from demo_project.pipelines import modelling as mod
from demo_project.pipelines import reporting as rep


def _get_generic_pipe() -> Pipeline:
    return Pipeline([
        node(
            func=lambda x: x,
            inputs="input_df",
            outputs="output_df",
        ),
    ])


def create_pipeline(**kwargs) -> Pipeline:
    pipe1 = Pipeline([
        pipeline(
            pipe=_get_generic_pipe(),
            inputs={"input_df": "input_to_processing"},
            outputs={"output_df": "post_first_pipe"},
            namespace="first_processing_step",
        ),
        pipeline(
            pipe=_get_generic_pipe(),
            inputs={"input_df": "input_to_processing"},
            outputs={"output_df": "output_from_processing"},
            namespace="second_processing_step",
        ),
    ])
    
    pipe2= pipeline(
        pipe=pipe1,
        inputs="input_to_processing",
        outputs={"output_from_processing","post_first_pipe"},
        namespace="processing",
    )
    
    
    pipe3 = Pipeline([
        pipeline(
            pipe=_get_generic_pipe(),
            inputs={"input_df": "input_to_processing"},
            outputs={"output_df": "post_first_pipe_2"},
            namespace="third_processing_step",
        ),
    ])
  
    return pipeline(
        pipe=pipe2+pipe3,
        inputs="input_to_processing",
        outputs={"output_from_processing"},
        namespace="main",
    )
    


def register_pipelines() -> Dict[str, Pipeline]:
    """Register the project's pipelines.

    Returns:
        A mapping from a pipeline name to a ``Pipeline`` object.

    """
    ingestion_pipeline = di.create_pipeline()

    feature_pipeline = fe.create_pipeline()

    modelling_pipeline = mod.create_pipeline(
        model_types=["linear_regression", "random_forest"]
    )

    reporting_pipeline = rep.create_pipeline()

    return {
        "__default__": create_pipeline(),}
    #     "__default__": (
    #         ingestion_pipeline
    #         + feature_pipeline
    #         + modelling_pipeline
    #         + reporting_pipeline
    #     ),
    #     "Data ingestion": ingestion_pipeline,
    #     "Modelling stage": modelling_pipeline,
    #     "Feature engineering": feature_pipeline,
    #     "Reporting stage": reporting_pipeline,
    #     "Pre-modelling": ingestion_pipeline + feature_pipeline,
    # }
