from kedro_viz.utils import merge_dicts


class TestUtils:
    def test_merge_dicts_flat(self):
        """Test merging flat dictionaries."""
        dict_one = {"a": 1, "b": 2}
        dict_two = {"b": 3, "c": 4}
        expected = {"a": 1, "b": 3, "c": 4}

        result = merge_dicts(dict_one, dict_two)
        assert result == expected

    def test_merge_dicts_nested(self):
        """Test merging nested dictionaries."""
        dict_one = {"a": {"x": 1}, "b": 2}
        dict_two = {"a": {"y": 2}, "c": 3}
        expected = {"a": {"x": 1, "y": 2}, "b": 2, "c": 3}

        result = merge_dicts(dict_one, dict_two)
        assert result == expected

    def test_merge_dicts_overwrite(self):
        """Test merging with overwriting nested keys."""
        dict_one = {"a": {"x": 1, "y": 2}}
        dict_two = {"a": {"x": 3}}
        expected = {"a": {"x": 3, "y": 2}}

        result = merge_dicts(dict_one, dict_two)
        assert result == expected

    def test_merge_dicts_empty(self):
        """Test merging when one dictionary is empty."""
        dict_one = {"a": 1}
        dict_two = {}
        expected = {"a": 1}

        result = merge_dicts(dict_one, dict_two)
        assert result == expected

        result = merge_dicts(dict_two, dict_one)
        assert result == expected
