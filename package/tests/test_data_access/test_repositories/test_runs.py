from kedro_viz.data_access.repositories import RunsRepository


class TestRunsRepository:
    def test_runs_repository_should_return_None_without_db_session(self):
        runs_repository = RunsRepository()
        assert runs_repository.get_all_runs() is None
        assert runs_repository.get_runs_by_ids(["id"]) is None
        assert runs_repository.get_user_run_details(["id"]) is None
        assert (
            runs_repository.create_or_update_user_run_details(
                1, "title", False, "notes"
            )
            is None
        )
