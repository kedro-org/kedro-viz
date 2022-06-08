"""
This is a boilerplate pipeline 'reporting'
generated using Kedro 0.18.1
"""
import matplotlib.pyplot as plt
import pandas as pd
import PIL
import plotly.express as px
from plotly import graph_objects as go

from .image_utils import DrawTable


def make_cancel_policy_bar_chart(
    model_input_data: pd.DataFrame, top_counties: int = 20
) -> pd.DataFrame:
    """This function performs a group by on the input table, limits the
    results to the top n countries based on price and returns the
    data needed to visualise a stacked bar chart. The DataFrame is
    rendered as a Plot using the YAML API exposed in the Kedro Catalog.

    Args:
        model_input_data (pd.DataFrame): The data to plot
        top_counties (int, optional): [description]. Defaults to 20.

    Returns:
        pd.DataFrame: The aggregated data ready for visualisation
    """
    country_policy_df = (
        model_input_data.groupby(["company_location", "cancellation_policy"])["price"]
        .sum()
        .reset_index()
    )

    high_value_countries = (
        model_input_data.groupby("company_location")
        .price.sum()
        .sort_values()
        .head(top_counties)
        .index
    )

    high_value_filter = country_policy_df.company_location.isin(high_value_countries)
    return country_policy_df[high_value_filter]


def make_price_histogram(model_input_data: pd.DataFrame) -> go.Figure:
    """This function retrieves the two key columns needed to visualise the
    price-engine histogram. We then prepare the Plotly figure using the
    Plotly Python API

    Args:
        model_input_data (pd.DataFrame): The data to plot

    Returns:
        BaseFigure: Plotly object which is serialised as JSON for rendering
    """
    price_data_df = model_input_data[["price", "engine_type"]]

    plotly_object = px.histogram(
        data_frame=price_data_df, x="price", log_x=True, color="engine_type"
    )
    return plotly_object


def make_price_analysis_image(model_input_table: pd.DataFrame) -> PIL.Image:
    """This function accepts a Pandas DataFrame and renders a bitmap
    plot of the data.

    This method is intended to show how easy it is to use a custom
    dataset in Kedro. You can read more here:
    https://kedro.readthedocs.io/en/stable/07_extend_kedro/03_custom_datasets.html

    Args:
        model_input_table (pd.DataFrame): The data to plot

    Returns:
        PIL.Image: An image of a table ready to be saved as .png
    """

    analysis_df = (
        model_input_table.groupby("cancellation_policy")[
            ["price", "review_scores_rating"]
        ]
        .mean()
        .reset_index()
    )

    pil_table = DrawTable(analysis_df)
    return pil_table.image


def create_matplotlib_chart(companies: pd.DataFrame):
    plt.plot([1, 2, 3], [4, 5, 6])
    return plt
