"""Tests for Kedro-compatible inspection parameter preparation."""

from dataclasses import dataclass

import pytest
from kedro.pipeline import node, pipeline
from pydantic import BaseModel

from kedro_viz.integrations.kedro.inspection.parameters import (
    build_parameter_feed,
    parameters_for_inputs,
    validate_parameters,
)


class _ModelOptions(BaseModel):
    count: int


@dataclass
class _DataclassOptions:
    count: int


def _consume_options(
    model_options: _ModelOptions,
    dataclass_options: _DataclassOptions,
) -> None:
    pass


def test_parameter_validation_uses_pipeline_annotations() -> None:
    options_pipeline = pipeline(
        [
            node(
                _consume_options,
                ["params:model_options", "params:dataclass_options"],
                None,
            )
        ]
    )

    validated = validate_parameters(
        {
            "model_options": {"count": "3"},
            "dataclass_options": {"count": 4},
        },
        {"options": options_pipeline},
    )

    assert validated == {
        "model_options": _ModelOptions(count=3),
        "dataclass_options": _DataclassOptions(count=4),
    }


def test_parameter_feed_expands_typed_parameter_fields() -> None:
    feed = build_parameter_feed(
        {
            "model_options": _ModelOptions(count=3),
            "dataclass_options": _DataclassOptions(count=4),
        }
    )

    assert feed["params:model_options.count"] == 3
    assert feed["params:dataclass_options.count"] == 4


@pytest.mark.parametrize(
    ("parameters", "expected"),
    [
        ({"literal.key": 7}, 7),
        ({"literal": {"key": 8}}, 8),
        ({"literal.key": 7, "literal": {"key": 8}}, 8),
        ({"literal": {"key": 8}, "literal.key": 7}, 7),
    ],
)
def test_parameter_feed_preserves_literal_and_nested_key_order(
    parameters: dict, expected: int
) -> None:
    feed = build_parameter_feed(parameters)

    assert feed["params:literal.key"] == expected


def test_parameter_inputs_use_the_prepared_feed() -> None:
    feed = build_parameter_feed({"model": {"test_size": 0.2}, "other": 1})

    assert parameters_for_inputs(["params:model.test_size"], feed) == {
        "model.test_size": 0.2
    }
    assert parameters_for_inputs(["params:missing"], feed) == {"missing": None}
    assert parameters_for_inputs(["params:model.test_size", "parameters"], feed) == {
        "model": {"test_size": 0.2},
        "other": 1,
    }
    assert parameters_for_inputs(["parameters", "params:model.test_size"], feed) == {
        "model": {"test_size": 0.2},
        "other": 1,
        "model.test_size": 0.2,
    }
