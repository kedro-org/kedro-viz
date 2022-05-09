import json

from kedro_viz.api.graphql import schema
from kedro_viz.models.experiments_tracking import RunModel


class TestRunsAddedSubscription:
    async def test_runs_added_subscription_with_no_existing_run(
        self, data_access_manager_with_no_run
    ):
        query = """
            subscription {
                runsAdded {
                    id
                    bookmark
                    gitSha
                    title
                }
            }
        """

        # start subscription
        subscription = await schema.subscribe(query)

        example_new_run_id = "test_id"
        run = RunModel(
            id=example_new_run_id,
            blob=json.dumps(
                {
                    "session_id": example_new_run_id,
                    "cli": {"command_path": "kedro run"},
                }
            ),
        )
        data_access_manager_with_no_run.runs.add_run(run)

        # assert subscription result
        async for result in subscription:
            assert not result.errors
            assert result.data == {
                "runsAdded": [
                    {
                        "id": example_new_run_id,
                        "bookmark": False,
                        "gitSha": None,
                        "title": example_new_run_id,
                    }
                ]
            }
            break

    async def test_runs_added_subscription_with_existing_runs(
        self, data_access_manager_with_runs
    ):
        query = """
            subscription {
                runsAdded {
                    id
                    bookmark
                    gitSha
                    title
                }
            }
        """
        all_runs = data_access_manager_with_runs.runs.get_all_runs()
        assert all_runs

        # start subscription
        subscription = await schema.subscribe(query)

        # add a new run
        example_new_run_id = "new_run"
        run = RunModel(
            id=example_new_run_id,
            blob=json.dumps(
                {
                    "session_id": example_new_run_id,
                    "cli": {"command_path": "kedro run"},
                }
            ),
        )
        data_access_manager_with_runs.runs.add_run(run)

        # assert subscription result
        async for result in subscription:
            assert not result.errors
            assert result.data == {
                "runsAdded": [
                    {
                        "id": example_new_run_id,
                        "bookmark": False,
                        "gitSha": None,
                        "title": example_new_run_id,
                    }
                ]
            }
            assert data_access_manager_with_runs.runs.last_run_id == example_new_run_id
            break
