from kedro.pipeline import Pipeline, node
from kedro.pipeline.modular_pipeline import pipeline

from .nodes import (
    aggregate_company_data,
    apply_types_to_companies,
    apply_types_to_reviews,
    apply_types_to_shuttles,
    combine_shuttle_level_information,
)


def create_pipeline(**kwargs) -> Pipeline:
    """This method imports the python functions which accept raw data,
    add types and wrangle into primary layer outputs.

    Returns:
        Pipeline: A set of nodes which take data from the raw to
        the intermediate then primary layers.
    """
    return Pipeline(
        [
            node(
                func=apply_types_to_companies,
                inputs="companies",
                outputs="int_typed_companies",
            ),
            node(
                func=apply_types_to_shuttles,
                inputs="shuttles",
                outputs="int_typed_shuttles",
            ),
            node(
                func=apply_types_to_reviews,
                inputs=["reviews", "params:typing.reviews.columns_as_floats"],
                outputs="int_typed_reviews",
            ),
            node(
                func=aggregate_company_data,
                inputs="int_typed_companies",
                outputs="prm_agg_companies",
                name="company_agg",
            ),
            node(
                func=combine_shuttle_level_information,
                inputs={
                    "shuttles": "int_typed_shuttles",
                    "reviews": "int_typed_reviews",
                    "companies": "prm_agg_companies",
                },
                outputs=["prm_shuttle_company_reviews", "prm_spine_table"],
                name="combine_step",
            ),
        ]
    )


def new_ingestion_pipeline(namespace: str = "ingestion") -> Pipeline:
    """This function creates a new instance of the ingestion pipeline
    declared above, however it ensures
    that the pipeline inputs and outputs are appropriately namespaced
    and the input/output datasets are mapped to the right catalog values.

    Args:
        namespace (str): The namespace to apply

    Returns:
        Pipeline: The correctly namespaced pipeline
    """
    return pipeline(
        pipe=create_pipeline(),
        namespace=namespace,  # provide inputs
        inputs={"reviews", "shuttles", "companies"},  # map inputs outside of namespace
        outputs={
            "prm_spine_table",
            "prm_shuttle_company_reviews",
        },
    )
