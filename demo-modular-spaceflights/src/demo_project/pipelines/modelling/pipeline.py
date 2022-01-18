from typing import List

from kedro.pipeline import Pipeline, node
from kedro.pipeline.modular_pipeline import pipeline

from .nodes import evaluate_model, split_data, train_model


def new_train_eval_template() -> Pipeline:
    """This two node pipeline will train a Sklearn model and return
    a regressor object along with `experiment_params` as tracked
    metadata.

    Returns:
        Pipeline: This pipeline has been designed in a way that
        allows the user to implement different parametrised Sklearn
        modelling approaches via modular pipeline instances.
    """
    return Pipeline(
        [
            node(
                func=train_model,
                inputs=["X_train", "y_train", "params:dummy_model_options"],
                outputs=["regressor", "experiment_params"],
            ),
            node(
                func=evaluate_model,
                inputs=["regressor", "X_test", "y_test"],
                outputs="r2_score",
            ),
        ]
    )


def new_modeling_pipeline(model_types: List[str]) -> Pipeline:
    """This function will create a complete modelling
    pipeline that consolidates a single shared 'split' stage,
    several modular instances of the 'train test evaluate' stage
    and returns a single, appropriately namespaced Kedro pipeline
    object:
    ┌───────────────────────────────┐
    │                               │
    │        ┌────────────┐         │
    │     ┌──┤ Split stage├───┐     │
    │     │  └──────┬─────┘   │     │
    │     │         │         │     │
    │ ┌───┴───┐ ┌───┴───┐ ┌───┴───┐ │
    │ │ Model │ │ Model │ │ Model │ │
    │ │ Type  │ │ Type  │ │  Type │ │
    │ │   1   │ │   2   │ │   n.. │ │
    │ └───────┘ └───────┘ └───────┘ │
    │                               │
    └───────────────────────────────┘

    Args:
        model_types (List[str]): The instances of Sklearn models
            we want to build, each of these must correspond to
            parameter keys of the same name

    Returns:
        Pipeline: A single pipeline encapsulating the split
            stage as well as one train/evaluation sub-pipeline
            for each `model_type` passed in.
    """

    test_train_refs = ["X_train", "X_test", "y_train", "y_test"]

    # Split the model_input data
    split_stage_pipeline = Pipeline(
        [
            node(
                func=split_data,
                inputs=["model_input_table", "params:split_options"],
                outputs=test_train_refs,
            )
        ]
    )

    # Instantiate a new modeling pipeline for every model type
    model_pipelines = [
        pipeline(
            pipe=new_train_eval_template(),
            parameters={
                "params:dummy_model_options": f"params:model_options.{model_type}"
            },
            inputs={k: k for k in test_train_refs},
            outputs={  # both of these are tracked as experiments
                "experiment_params": f"hyperparams_{model_type}",
                "r2_score": f"r2_score_{model_type}",
            },
            namespace=f"{model_type}",
        )
        for model_type in model_types
    ]

    # Combine modeling pipeliens into one pipeline object
    all_modeling_pipelines = sum(model_pipelines)

    # Namespace consolidated modeling pipelines
    consolidated_model_pipelines = pipeline(
        pipe=all_modeling_pipelines,
        namespace="train_evaluation",
        inputs=test_train_refs,
    )

    # Combine split and modeling stages into one pipeline
    complete_model_pipeline = split_stage_pipeline + consolidated_model_pipelines
    return complete_model_pipeline
