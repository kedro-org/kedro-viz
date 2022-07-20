import json

import pytest

from kedro_viz.models.experiment_tracking import RunModel


@pytest.mark.usefixtures("data_access_manager_with_runs")
class TestGraphQLMutation:
    @pytest.mark.parametrize(
        "bookmark,notes,title",
        [
            (
                False,
                "new notes",
                "new title",
            ),
            (True, "new notes", "new title"),
            (True, "", ""),
        ],
    )
    def test_update_user_details_success(
        self,
        bookmark,
        notes,
        title,
        client,
        example_run_ids,
    ):
        example_run_id = example_run_ids[0]
        query = f"""
            mutation updateRun {{
              updateRunDetails(
                  runId: "{example_run_id}",
                  runInput: {{bookmark: {str(bookmark).lower()}, notes: "{notes}", title: "{title}"}}
                ) {{
                    __typename
                    ... on UpdateRunDetailsSuccess {{
                        run {{
                            id
                            title
                            bookmark
                            notes
                        }}
                    }}
                    ... on UpdateRunDetailsFailure {{
                      id
                      errorMessage
                    }}
                }}
            }}
        """
        response = client.post("/graphql", json={"query": query})
        assert response.json() == {
            "data": {
                "updateRunDetails": {
                    "__typename": "UpdateRunDetailsSuccess",
                    "run": {
                        "id": example_run_id,
                        "bookmark": bookmark,
                        "title": title if title != "" else example_run_id,
                        "notes": notes,
                    },
                }
            }
        }

    def test_update_user_details_only_bookmark(
        self,
        client,
        example_run_ids,
    ):
        example_run_id = example_run_ids[0]
        query = f"""
            mutation updateRun {{
                updateRunDetails(runId: "{example_run_id}", runInput: {{bookmark: true}}) {{
                    __typename
                    ... on UpdateRunDetailsSuccess {{
                        run {{
                            id
                            title
                            bookmark
                            notes
                        }}
                    }}
                    ... on UpdateRunDetailsFailure {{
                        id
                        errorMessage
                    }}
                }}
            }}
        """

        response = client.post("/graphql", json={"query": query})
        assert response.json() == {
            "data": {
                "updateRunDetails": {
                    "__typename": "UpdateRunDetailsSuccess",
                    "run": {
                        "id": example_run_id,
                        "bookmark": True,
                        "title": example_run_id,
                        "notes": "",
                    },
                }
            }
        }

    def test_update_user_details_should_add_when_no_details_exist(
        self, client, data_access_manager_with_no_run
    ):
        # add a new run
        example_run_id = "test_id"
        run = RunModel(
            id=example_run_id,
            blob=json.dumps(
                {"session_id": example_run_id, "cli": {"command_path": "kedro run"}}
            ),
        )
        data_access_manager_with_no_run.runs.add_run(run)

        query = f"""
            mutation updateRun {{
              updateRunDetails(runId: "{example_run_id}", runInput: {{bookmark: true}}) {{
                __typename
                ... on UpdateRunDetailsSuccess {{
                    run {{
                        id
                        title
                        bookmark
                        notes
                    }}
                }}
                ... on UpdateRunDetailsFailure {{
                    id
                    errorMessage
                }}
              }}
            }}
        """

        response = client.post("/graphql", json={"query": query})
        assert response.json() == {
            "data": {
                "updateRunDetails": {
                    "__typename": "UpdateRunDetailsSuccess",
                    "run": {
                        "id": example_run_id,
                        "bookmark": True,
                        "title": example_run_id,
                        "notes": "",
                    },
                }
            }
        }

    def test_update_user_details_should_update_when_details_exist(
        self, client, example_run_ids
    ):
        example_run_id = example_run_ids[0]
        query = f"""
            mutation updateRun {{
              updateRunDetails(runId: "{example_run_id}", runInput: {{title:"new title", notes: "new notes"}}) {{
                __typename
                ... on UpdateRunDetailsSuccess {{
                    run {{
                        id
                        title
                        bookmark
                        notes
                    }}
                }}
                ... on UpdateRunDetailsFailure {{
                    id
                    errorMessage
                }}
              }}
            }}
        """

        response = client.post("/graphql", json={"query": query})
        assert response.json() == {
            "data": {
                "updateRunDetails": {
                    "__typename": "UpdateRunDetailsSuccess",
                    "run": {
                        "id": example_run_id,
                        "bookmark": True,
                        "title": "new title",
                        "notes": "new notes",
                    },
                }
            }
        }

    def test_update_user_details_should_fail_when_run_doesnt_exist(self, client):
        response = client.post(
            "/graphql",
            json={
                "query": """
                    mutation {
                        updateRunDetails(
                            runId: "I don't exist",
                            runInput: { bookmark: false, title: "Hello Kedro", notes: "There are notes"}
                        ) {
                            __typename
                            ... on UpdateRunDetailsSuccess {
                                run {
                                    id
                                    title
                                    notes
                                    bookmark
                                }
                            }
                            ... on UpdateRunDetailsFailure {
                                id
                                errorMessage
                            }
                        }
                    }
                """
            },
        )
        assert response.json() == {
            "data": {
                "updateRunDetails": {
                    "__typename": "UpdateRunDetailsFailure",
                    "id": "I don't exist",
                    "errorMessage": "Given run_id: I don't exist doesn't exist",
                }
            }
        }
