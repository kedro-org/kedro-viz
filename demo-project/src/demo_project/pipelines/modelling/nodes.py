import importlib
import logging
import random
from typing import Any, Dict, Tuple

import pandas as pd
from kedro.pipeline.preview_contract import MermaidPreview
from sklearn.base import BaseEstimator
from sklearn.metrics import r2_score
from sklearn.model_selection import train_test_split


def get_split_data_graph() -> MermaidPreview:
    return MermaidPreview(
        content="""graph TD
    A[Input Dataset] --> B{Split Data}
    B -->|Features| C[X: Independent Variables]
    B -->|Target| D[y: Target Variable]
    C --> E[train_test_split]
    D --> E
    E -->|Training Set| F[X_train]
    E -->|Training Set| G[y_train]
    E -->|Test Set| H[X_test]
    E -->|Test Set| I[y_test]

    style A fill:#e1f5ff
    style F fill:#c8e6c9
    style G fill:#c8e6c9
    style H fill:#fff9c4
    style I fill:#fff9c4
    style E fill:#e1bee7"""
    )


def split_data(data: pd.DataFrame, split_options: Dict) -> Tuple:
    """Splits data into features and targets training and test sets.

    Args:
        data: Data containing features and target.
        parameters: Parameters defined in parameters.yml.
    Returns:
        Split data.
    """
    target_variable = split_options["target"]
    independent_variables = [x for x in data.columns if x != target_variable]
    test_size = split_options["test_size"]
    random_state = split_options["random_state"]

    logger = logging.getLogger(__name__)
    logger.info(
        f"Splitting data for the following independent variables "
        f"{independent_variables} against the target of '{target_variable}' "
        f"with a test sized of {test_size} and a random state of "
        f"'{random_state}'"
    )

    X = data[independent_variables]
    y = data[target_variable]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state
    )

    return X_train, X_test, y_train, y_test


def train_model(
    X_train: pd.DataFrame, y_train: pd.Series, model_options: Dict[str, Any]
) -> Tuple[BaseEstimator, Dict[str, Any]]:
    """Trains the linear regression model.

    Args:
        X_train: Training data of independent features.
        y_train: Training data for price.

    Returns:
        Trained model.
    """

    # Parse parameters
    model_module = model_options.get("module")
    model_type = model_options.get("class")
    model_arguments = model_options.get("kwargs")

    # Import and instantiate Sklearn regressor object
    regressor_class = getattr(importlib.import_module(model_module), model_type)
    regressor_instance = regressor_class(**model_arguments)

    logger = logging.getLogger(__name__)
    logger.info(f"Fitting model of type {type(regressor_instance)}")

    # Fit model
    regressor_instance.fit(X_train, y_train)
    flat_model_params = {**{"model_type": model_type}, **model_arguments}
    return regressor_instance, flat_model_params


def evaluate_model(
    regressor: BaseEstimator,
    X_test: pd.DataFrame,
    y_test: pd.Series,
) -> Dict[str, float]:
    """Calculates and logs the coefficient of determination.

    Args:
        regressor: Trained model.
        X_test: Testing data of independent features.
        y_test: Testing data for price.
    """
    y_pred = regressor.predict(X_test)
    score = r2_score(y_test, y_pred)
    a2_score = random.randint(0, 100) * 0.1
    b2_score = random.randint(0, 100) * 0.1
    logger = logging.getLogger(__name__)
    logger.info(
        f"Model has a coefficient R^2 of {score:.3f} on test data using a "
        f"regressor of type '{type(regressor)}'"
    )
    return {"r2_score": score, "a2_score": a2_score, "b2_score": b2_score}
