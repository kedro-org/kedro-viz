from pathlib import Path
from unittest.mock import call

import pytest
from kedro.extras.datasets.tracking import JSONDataSet
from kedro.io import DataCatalog, Version
from strawberry import ID
from strawberry.printer import print_schema

from kedro_viz.api.graphql import (
    JSONObject,
    TrackingDataset,
    get_run_tracking_data,
    schema,
)
from kedro_viz.data_access.managers import DataAccessManager


class TestTrackingData:
    @pytest.mark.parametrize(
        "show_diff,run_tracking_output",
        [
            (
                True,
                [
                    TrackingDataset(
                        datasetName="new_metrics",
                        datasetType="kedro.extras.datasets.tracking.metrics_dataset.MetricsDataSet",
                        data=JSONObject(
                            {
                                "col1": [
                                    {"runId": "2021-11-03T18.24.24.379Z", "value": 3.0},
                                    {"runId": "2021-11-02T18.24.24.379Z", "value": 1.0},
                                ],
                                "col2": [
                                    {
                                        "runId": "2021-11-03T18.24.24.379Z",
                                        "value": 3.23,
                                    },
                                ],
                                "col3": [
                                    {"runId": "2021-11-02T18.24.24.379Z", "value": 3.0},
                                ],
                            }
                        ),
                    )
                ],
            ),
            (
                False,
                [
                    TrackingDataset(
                        datasetName="new_metrics",
                        datasetType="kedro.extras.datasets.tracking.metrics_dataset.MetricsDataSet",
                        data=JSONObject(
                            {
                                "col1": [
                                    {"runId": "2021-11-03T18.24.24.379Z", "value": 3.0},
                                    {"runId": "2021-11-02T18.24.24.379Z", "value": 1.0},
                                ]
                            }
                        ),
                    )
                ],
            ),
        ],
    )
    def test_graphql_run_tracking_data(
        self,
        example_run_ids,
        example_multiple_run_tracking_catalog,
        show_diff,
        run_tracking_output,
        data_access_manager: DataAccessManager,
        mocker,
    ):
        mocker.patch("kedro_viz.api.graphql.data_access_manager", data_access_manager)
        data_access_manager.add_catalog(example_multiple_run_tracking_catalog)
        assert (
            get_run_tracking_data([ID(run_id) for run_id in example_run_ids], show_diff)
            == run_tracking_output
        )

    @pytest.mark.parametrize(
        "show_diff,run_tracking_output",
        [
            (
                True,
                [
                    TrackingDataset(
                        datasetName="new_metrics",
                        datasetType="kedro.extras.datasets.tracking.metrics_dataset.MetricsDataSet",
                        data=JSONObject(
                            {
                                "col1": [
                                    {"runId": "2021-11-02T18.24.24.379Z", "value": 1.0},
                                ],
                                "col3": [
                                    {"runId": "2021-11-02T18.24.24.379Z", "value": 3.0},
                                ],
                            }
                        ),
                    )
                ],
            ),
            (
                False,
                [
                    TrackingDataset(
                        datasetName="new_metrics",
                        datasetType="kedro.extras.datasets.tracking.metrics_dataset.MetricsDataSet",
                        data=JSONObject({}),
                    )
                ],
            ),
        ],
    )
    def test_graphql_run_tracking_data_at_least_one_empty_run(
        self,
        example_run_ids,
        show_diff,
        example_multiple_run_tracking_catalog_at_least_one_empty_run,
        run_tracking_output,
        data_access_manager: DataAccessManager,
        mocker,
    ):
        mocker.patch("kedro_viz.api.graphql.data_access_manager", data_access_manager)
        data_access_manager.add_catalog(
            example_multiple_run_tracking_catalog_at_least_one_empty_run
        )

        assert (
            get_run_tracking_data([ID(run_id) for run_id in example_run_ids], show_diff)
            == run_tracking_output
        )

    @pytest.mark.parametrize(
        "show_diff,run_tracking_output",
        [
            (
                True,
                [
                    TrackingDataset(
                        datasetName="new_metrics",
                        datasetType="kedro.extras.datasets.tracking.metrics_dataset.MetricsDataSet",
                        data=JSONObject({}),
                    )
                ],
            ),
            (
                False,
                [
                    TrackingDataset(
                        datasetName="new_metrics",
                        datasetType="kedro.extras.datasets.tracking.metrics_dataset.MetricsDataSet",
                        data=JSONObject({}),
                    )
                ],
            ),
        ],
    )
    def test_graphql_run_tracking_data_all_empty_runs(
        self,
        example_run_ids,
        example_multiple_run_tracking_catalog_all_empty_runs,
        show_diff,
        run_tracking_output,
        data_access_manager: DataAccessManager,
        mocker,
    ):
        mocker.patch("kedro_viz.api.graphql.data_access_manager", data_access_manager)
        data_access_manager.add_catalog(
            example_multiple_run_tracking_catalog_all_empty_runs
        )

        assert (
            get_run_tracking_data([ID(run_id) for run_id in example_run_ids], show_diff)
            == run_tracking_output
        )

    def test_graphql_run_tracking_no_filepath_query(
        self,
        example_run_ids,
        data_access_manager_with_runs,
        mocker,
    ):
        patched_warning = mocker.patch("logging.Logger.warning")
        json_dataset = JSONDataSet(
            filepath="not_exist.json",
            version=Version(None, example_run_ids[0]),
        )

        catalog = DataCatalog(
            data_sets={
                "json_tracking": json_dataset,
            }
        )
        data_access_manager_with_runs.add_catalog(catalog)

        assert get_run_tracking_data([ID(example_run_ids[0])], False) == [
            TrackingDataset(
                datasetName="json_tracking",
                datasetType="kedro.extras.datasets.tracking.json_dataset.JSONDataSet",
                data=JSONObject({}),
            )
        ]

        patched_warning.assert_has_calls(
            [
                call(
                    "`%s` could not be found",
                    json_dataset._get_versioned_path(str(example_run_ids[0])),
                )
            ]
        )


class TestGraphQLSchema:
    def test_apollo_schema(self):
        schema_file = Path(__file__).parents[4] / "src" / "apollo" / "schema.graphql"
        with schema_file.open() as data:
            apollo_schema = data.read()

        assert apollo_schema.strip() == print_schema(schema)
