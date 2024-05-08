from kedro.pipeline import Pipeline, node
from kedro.pipeline.modular_pipeline import pipeline

def create_pipeline(**kwargs) -> Pipeline:
    return pipeline(
        [
            node(
                func=lambda dataset_1, dataset_2: (dataset_1, dataset_2),
                inputs=["dataset_1", "dataset_2"],
                outputs="dataset_3",
                name="first_node",
            ),
            node(
                func=lambda dataset_1, dataset_2: (dataset_1, dataset_2),
                inputs=["dataset_3", "dataset_4"],
                outputs="dataset_5",
                name="second_node",
            ),
            node(
                func=lambda dataset_1, dataset_2: (dataset_1, dataset_2),
                inputs=["dataset_5", "dataset_6"],
                outputs="dataset_7", 
                name="third_node",
                namespace="namespace_prefix_1",
            ),
            node(
                func=lambda dataset_1, dataset_2: (dataset_1, dataset_2),
                inputs=["dataset_7", "dataset_8"],
                outputs="dataset_9",
                name="fourth_node",
                namespace="namespace_prefix_1",
            ),
            node(
                func=lambda dataset_1, dataset_2: (dataset_1, dataset_2),
                inputs=["dataset_9", "dataset_10"],
                outputs="dataset_11",
                name="fifth_node",
                namespace="namespace_prefix_1",
            ),
        ]
    )