from kedro_viz.data_access.repositories import RegisteredPipelinesRepository


class TestRegisteredPipelinesrepository:
    def test_get_node_ids_in_pipeline(self):
        repo = RegisteredPipelinesRepository()
        repo.add_node("__default__", "a")
        repo.add_node("__default__", "b")
        assert repo.get_node_ids_by_pipeline_id("__default__") == {"a", "b"}
        assert repo.get_node_ids_by_pipeline_id("another") == set()

    def test_get_pipeline_ids(self, identity):
        repo = RegisteredPipelinesRepository()
        repo.add_pipeline("__default__")
        repo.add_pipeline("random")
        assert repo.get_pipeline_ids() == ["__default__", "random"]
