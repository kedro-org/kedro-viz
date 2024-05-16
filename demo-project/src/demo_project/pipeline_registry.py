"""Project pipelines."""
from typing import Dict

from kedro.pipeline import Pipeline, pipeline, node

from demo_project.pipelines import data_ingestion as di
from demo_project.pipelines import feature_engineering as fe
from demo_project.pipelines import modelling as mod
from demo_project.pipelines import reporting as rep

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
        namespace="uk.something1.data_processing",
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
        namespace="uk.something2.data_science",
        inputs="model_inputs",
    )
    return data_processing_pipeline + data_science_pipeline


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
        "__default__": create_pipeline(),
        # "__default__": (
        #     ingestion_pipeline
        #     + feature_pipeline
        #     + modelling_pipeline
        #     + reporting_pipeline
        # ),
        # "Data ingestion": ingestion_pipeline,
        # "Modelling stage": modelling_pipeline,
        # "Feature engineering": feature_pipeline,
        # "Reporting stage": reporting_pipeline,
        # "Pre-modelling": ingestion_pipeline + feature_pipeline,
    }
