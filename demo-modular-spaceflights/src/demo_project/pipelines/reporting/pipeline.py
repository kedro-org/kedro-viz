"""
This is a boilerplate pipeline 'reporting'
generated using Kedro 0.17.6
"""

from kedro.pipeline import Pipeline, node

from demo_project.pipelines.reporting.nodes import (
    make_cancel_policy_bar_chart,
    make_price_analysis_image,
    make_price_histogram,
)


def create_pipeline(**kwargs) -> Pipeline:
    """This is a simple pipeline which generates a series of plots"""
    return Pipeline(
        [
            node(
                func=make_cancel_policy_bar_chart,
                inputs="prm_shuttle_company_reviews",
                outputs="cancellation_policy_breakdown",
            ),
            node(
                func=make_price_histogram,
                inputs="prm_shuttle_company_reviews",
                outputs="price_histogram",
            ),
            node(
                func=make_price_analysis_image,
                inputs="prm_shuttle_company_reviews",
                outputs="cancellation_policy_grid",
            ),
        ]
    )
