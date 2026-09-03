"""Prepare and resolve Kedro parameters for inspection-backed responses."""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from typing import TYPE_CHECKING, Any

from kedro.validation.utils import get_typed_fields

if TYPE_CHECKING:
    from kedro.pipeline import Pipeline


def validate_parameters(
    raw_parameters: Mapping[str, Any],
    pipelines: Mapping[str, Pipeline],
) -> dict[str, Any]:
    """Apply Kedro's pipeline-annotation validation to resolved parameters."""
    from kedro.validation.parameter_validator import ParameterValidator

    return ParameterValidator(dict(pipelines)).validate_raw_params(dict(raw_parameters))


def build_parameter_feed(
    parameters: Mapping[str, Any],
) -> dict[str, Any]:
    """Build Kedro's ordered mapping from pipeline references to parameter values."""
    parameter_values = dict(parameters)
    feed: dict[str, Any] = {"parameters": parameter_values}

    def add_parameter(name: str, value: Any) -> None:
        feed[f"params:{name}"] = value
        fields = value if isinstance(value, dict) else get_typed_fields(value)
        if fields is not None:
            for field_name, field_value in fields.items():
                add_parameter(f"{name}.{field_name}", field_value)

    for parameter_name, parameter_value in parameter_values.items():
        add_parameter(parameter_name, parameter_value)

    return feed


def parameters_for_inputs(
    inputs: Iterable[str],
    parameter_feed: Mapping[str, Any],
) -> dict[str, Any]:
    """Return values for parameter inputs using Kedro's prepared reference feed."""
    result: dict[str, Any] = {}
    for reference in inputs:
        if reference == "parameters":
            result = dict(parameter_feed.get(reference, {}))
        elif reference.startswith("params:"):
            result[reference.removeprefix("params:")] = parameter_feed.get(reference)
    return result
