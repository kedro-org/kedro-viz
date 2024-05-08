from kedro.pipeline import Pipeline, node
from kedro.pipeline.modular_pipeline import pipeline

def create_pipeline(**kwargs) -> Pipeline:
    new_pipeline = pipeline(
        [
            node(lambda x: x,
                 inputs="dataset_in",
                 outputs="dataset_1",
                 name="step1"),
            node(lambda x: x,
                 inputs="dataset_1",
                 outputs="dataset_2",
                 name="step2"),
            node(lambda x: x,
                 inputs="dataset_2",
                 outputs="dataset_3",
                 name="step3"),
            node(lambda x: x,
                 inputs="dataset_3",
                 outputs="dataset_out",
                 name="step4"
            )
        ],
            namespace="main_pipeline",
        inputs=None,
        outputs={"dataset_out", "dataset_3"}
    )
    return new_pipeline