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
    add types and wrangle into primary layer outputs. The pipeline
    inputs and outputs are appropriately namespaced and the
    input/output datasets are mapped to the right catalog values.

    Returns:
        Pipeline: A set of nodes which take data from the raw to
        the intermediate then primary layers.
    """

    return pipeline(
        [
            node(
                func=apply_types_to_companies,
                inputs="companies",
                outputs="int_typed_companies",
                name='apply_types_to_companies',
                tags='companies'
            ),
            node(
                func=apply_types_to_shuttles,
                inputs="shuttles",
                outputs="int_typed_shuttles@pandas1",
                name='apply_types_to_shuttles',
                tags='shuttles'
            ),
            node(
                func=apply_types_to_reviews,
                inputs=["reviews", "params:typing.reviews.columns_as_floats"],
                outputs="int_typed_reviews",
                name='apply_types_to_reviews'
                
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
                    "shuttles": "int_typed_shuttles@pandas2",
                    "reviews": "int_typed_reviews",
                    "companies": "prm_agg_companies",
                },
                outputs=["prm_shuttle_company_reviews", "prm_spine_table"],
                name="combine_step",
            ),
            node(
                func=lambda x: x,
                inputs="prm_spine_table",
                outputs="prm_spine_table_clone",
            ),
        ],
        namespace="ingestion",  # provide inputs
        inputs={"reviews", "shuttles", "companies"},  # map inputs outside of namespace
        outputs={
            "prm_spine_table",
            "prm_shuttle_company_reviews",
        },
    )
