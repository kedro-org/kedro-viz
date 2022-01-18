import json

from kedro_viz.api.graphql import schema
from kedro_viz.models.experiments_tracking import RunModel


class TestRunsAddedSubscription:
    async def test_runs_added_subscription(
        self, example_run_ids, data_access_manager_with_no_run
    ):
        query = """
            subscription {
                runsAdded {
                    id
                    bookmark
                    gitSha
                    timestamp
                    title
                }
            }
        """

        # start subscription
        subscription = await schema.subscribe(query)

        example_new_run_id = example_run_ids[0]
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
                        "timestamp": example_new_run_id,
                        "title": example_new_run_id,
                    }
                ]
            }
