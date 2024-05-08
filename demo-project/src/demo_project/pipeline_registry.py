"""Project pipelines."""
from typing import Dict

from kedro.pipeline import Pipeline

from demo_project.pipelines import data_ingestion as di
from demo_project.pipelines import feature_engineering as fe
from demo_project.pipelines import modelling as mod
from demo_project.pipelines import reporting as rep
from demo_project.pipelines.modular_pipeline_test import use_case_1, use_case_2, use_case_3, use_case_4, use_case_5, use_case_6


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
    
    use_case_1_pipeline = use_case_1.create_pipeline()
    use_case_2_pipeline = use_case_2.create_pipeline()
    use_case_3_pipeline = use_case_3.create_pipeline()
    use_case_4_pipeline = use_case_4.create_pipeline()
    use_case_5_pipeline = use_case_5.create_pipeline()
    use_case_6_pipeline = use_case_6.create_pipeline()
   

    
    return {
        "UseCase1": use_case_1_pipeline,
        "UseCase2": use_case_2_pipeline,
        "UseCase3": use_case_3_pipeline,
        "UseCase4": use_case_4_pipeline,
        "UseCase5": use_case_5_pipeline,
        "UseCase6": use_case_6_pipeline
    }

    # return {
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