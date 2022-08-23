"""
This is a boilerplate pipeline 'reporting'
generated using Kedro 0.18.1
"""

from kedro.pipeline import Pipeline, node, pipeline

from demo_project.pipelines.reporting.nodes import (
    create_matplotlib_chart,
    make_cancel_policy_bar_chart,
    make_price_analysis_image,
    make_price_histogram,
    create_feature_importance_plot
)


def create_pipeline(**kwargs) -> Pipeline:
    """This is a simple pipeline which generates a series of plots"""
    return pipeline(
        [
            node(
                func=make_cancel_policy_bar_chart,
                inputs="prm_shuttle_company_reviews",
                outputs="reporting.cancellation_policy_breakdown",
            ),
            node(
                func=make_price_histogram,
                inputs="prm_shuttle_company_reviews",
                outputs="reporting.price_histogram",
            ),
            node(
                func=make_price_analysis_image,
                inputs="prm_shuttle_company_reviews",
                outputs="reporting.cancellation_policy_grid",
            ),
            node(
                func=create_feature_importance_plot,
                inputs="feature_engineering.feature_importance_output",
                outputs="reporting.feature_importance",
            ),
            node(
                func=create_matplotlib_chart,
                inputs="prm_shuttle_company_reviews",
                outputs="reporting.confusion_matrix",
            ),
        ],
        inputs=["prm_shuttle_company_reviews"],
    )
