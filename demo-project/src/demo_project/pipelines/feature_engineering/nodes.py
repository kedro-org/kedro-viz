"""
This is a boilerplate pipeline 'feature_engineering'
generated using Kedro 0.18.0
"""

from functools import reduce
from typing import Dict, List

import numpy
import pandas as pd


def _get_id_columns(data: pd.DataFrame) -> List[str]:
    return [x for x in data.columns if x.endswith("_id")]


def create_static_features(data: pd.DataFrame, column_names: List[str]) -> pd.DataFrame:
    """This function accepts a pandas DataFrame as well as a list of
    columns to keep in scope. A DataFrame limited to any ID columns as well
    as the provided column names will be returned

    Args:
        data (pd.DataFrame): The DataFrame to process
        column_names (List[str]): The column names to keep in scope

    Returns:
        (pd.DataFrame): The limited DataFrame to return
    """
    id_columns = _get_id_columns(data)
    columns_to_select = id_columns + column_names
    return data[columns_to_select]


def _create_metric_column(
    data: pd.DataFrame,
    column_a: str,
    column_b: str,
    numpy_method: str,
    conjunction: str,
) -> pd.DataFrame:
    """This method will retrieve a numpy function, combine two columns and make
    a new column. it then retruns a new DataFrame which is the available ID
    columns plus the new column.

    Args:
        data (pd.DataFrame): The DataFrame to work with
        column_a (str): The left operand to the numpy function
        columb_b (str): The right operand to the numpy function
        numpy_method (str): The numpy function to use such as `numpy.divide`
        conjunction (str): This is used to name the new column
            i.e. {a}_{conjunction}_{b}

    Returns:
        pd.DataFrame: A new feature table
    """
    column_operation = getattr(numpy, numpy_method)
    new_column = column_operation(data[column_a], data[column_b])
    id_columns = _get_id_columns(data=data)
    working_df = data[id_columns]
    working_df.assign(**{f"{column_a}_{conjunction}_{column_b}": new_column})
    return working_df


def create_derived_features(
    spine_df: pd.DataFrame, data: pd.DataFrame, derived_params: Dict[str, str]
) -> pd.DataFrame:
    """[summary]

    Args:
        spine_df (pd.DataFrame): [description]
        data (pd.DataFrame): [description]
        derived_params (Dict[str, str]): [description]
    """
    new_columns = [_create_metric_column(data, **kwargs) for kwargs in derived_params]
    combined_df = joiner(spine_df, *new_columns)
    return combined_df


def joiner(spine_df: pd.DataFrame, *dfs: pd.DataFrame) -> pd.DataFrame:
    """This function takes an arbitrary number of DataFrames and will
    keep left-joining them to themselves along any columns suffixed
    with "id". There is an assumption that the tables passed in share
    the same identifiers and grain.

    Args:
        spine_df (pd.DataFrame): The first argument should simply contain
        the identifier columns at the correct grain.
        *dfs (pd.DataFrame): Any subsequent tables are joined to the spine

    Returns:
        pd.DataFrame: A single data-frame where all inputs to this function
            have been left joined together.
    """
    id_columns = _get_id_columns(data=spine_df)

    merged_dfs = reduce(
        lambda df, df2: df.merge(df2, on=id_columns, how="left"), dfs, spine_df
    )
    # Confirm that the number of rows is unchanged after the operation has completed
    assert spine_df.shape[0] == merged_dfs.shape[0]
    return merged_dfs
