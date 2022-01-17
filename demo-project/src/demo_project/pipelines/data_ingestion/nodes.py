from typing import List, Tuple

import numpy as np
import pandas as pd


def _is_true(column: pd.Series) -> pd.Series:
    return column == "t"


def apply_types_to_companies(companies: pd.DataFrame) -> pd.DataFrame:
    """Preprocesses the data for companies.

    Args:
        companies: Raw data.
    Returns:
        Preprocessed data, with `company_rating` converted to a float and
        `iata_approved` converted to boolean.
    """
    companies["iata_approved"] = _is_true(companies["iata_approved"])
    companies["company_rating"] = (
        companies["company_rating"].str.replace("%", "").astype(float) / 100
    )
    return companies


def apply_types_to_shuttles(shuttles: pd.DataFrame) -> pd.DataFrame:
    """Preprocesses the data for shuttles.

    Args:
        shuttles: Raw data.
    Returns:
        Preprocessed data, with `price` converted to a float and `d_check_complete`,
        `moon_clearance_complete` converted to boolean.
    """
    shuttles["d_check_complete"] = _is_true(shuttles["d_check_complete"])
    shuttles["moon_clearance_complete"] = _is_true(shuttles["moon_clearance_complete"])
    shuttles["price"] = (
        shuttles["price"].str.replace(r"[\$,]", "", regex=True).astype(float)
    )
    return shuttles


def apply_types_to_reviews(
    reviews: pd.DataFrame, columns_as_floats: List[str]
) -> pd.DataFrame:
    """Preprocess the data for reviews

    Args:
        reviews: Raw data
        columns_as_floats: Which columns to cast as floats
    Returns:
        Preprocessed data, with parametrised columns cast as `float`, all other columns
        will be cast as `int` data types. Null values are dropped

    """
    non_null_reviews = reviews.dropna()

    # Retrieve columns to type
    all_columns_set = set(non_null_reviews.columns)
    float_columns_set = set(columns_as_floats)
    integer_columns_set = all_columns_set - float_columns_set

    # Prepare dictionaries to apply
    new_integer_columns = {c: int for c in integer_columns_set}
    new_float_columns = {c: float for c in float_columns_set}
    new_dtypes = {**new_integer_columns, **new_float_columns}  # merge dictionaries

    # Apply types
    typed_reviews = non_null_reviews.astype(new_dtypes)

    # With add ID column to review table
    return typed_reviews.assign(review_id=lambda df: df.index + 1)


def aggregate_company_data(typed_companies: pd.DataFrame) -> pd.DataFrame:
    """This function aggregates company data so that we have one
    record per company.

    Args:
        typed_companies: The typed company information

    Returns:
        pd.DataFrame: Company with duplicates merged through aggregation.
    """

    working_companies = typed_companies.groupby(["id"]).agg(
        {
            "company_rating": np.mean,
            "company_location": lambda x: list(set(x))[0],  # Take first item
            "total_fleet_count": max,
            "iata_approved": any,
        }
    )
    return working_companies.reset_index().rename(columns={"id": "company_id"})


def combine_shuttle_level_information(
    shuttles: pd.DataFrame, companies: pd.DataFrame, reviews: pd.DataFrame
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Combines all data to create a domain level primary table.

    Args:
        shuttles: Preprocessed data for shuttles.
        companies: Preprocessed data for companies.
        reviews: Raw data for reviews.
    Returns:
        Combined primary layer table

    """
    rated_shuttles = shuttles.rename(columns={"id": "shuttle_id"}).merge(
        reviews, on="shuttle_id", how="inner"
    )
    combined_table = rated_shuttles.merge(companies, on="company_id", how="inner")

    working_table = combined_table.dropna(how="any")
    id_columns = [x for x in working_table.columns if x.endswith("id")]
    return working_table, working_table[id_columns]
