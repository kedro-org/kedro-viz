import pytest
from pydantic import ValidationError

from kedro_viz.models.metadata import Metadata, NodeExtras, PackageCompatibility


class TestPackageCompatibility:
    def test_package_compatibility_valid_data(self):
        package = PackageCompatibility(
            package_name="kedro", package_version="0.18.0", is_compatible=True
        )
        assert package.package_name == "kedro"
        assert package.package_version == "0.18.0"
        assert package.is_compatible is True

    def test_package_compatibility_invalid_package_name(self):
        with pytest.raises(ValidationError) as excinfo:
            PackageCompatibility(
                package_name=123,  # invalid type
                package_version="0.18.0",
                is_compatible=True,
            )
        assert "Input should be a valid string" in str(excinfo.value)

    def test_package_compatibility_invalid_package_version(self):
        with pytest.raises(ValidationError) as excinfo:
            PackageCompatibility(
                package_name="kedro",
                package_version=123,  # invalid type
                is_compatible=True,
            )
        assert "Input should be a valid string" in str(excinfo.value)

    def test_package_compatibility_invalid_is_compatible(self):
        with pytest.raises(ValidationError) as excinfo:
            PackageCompatibility(
                package_name="kedro",
                package_version="0.18.0",
                is_compatible="random",  # invalid type
            )
        assert "Input should be a valid boolean" in str(excinfo.value)


class TestMetadata:
    def test_metadata_default_values(self):
        # Test default values of Metadata
        assert Metadata.has_missing_dependencies is False
        assert not Metadata.package_compatibilities

    def test_metadata_set_package_compatibilities(self):
        kedro_package = PackageCompatibility(
            package_name="kedro", package_version="0.18.0", is_compatible=True
        )
        pandas_package = PackageCompatibility(
            package_name="pandas", package_version="1.2.0", is_compatible=False
        )

        # Set the package compatibilities using the class method
        Metadata.set_package_compatibilities([kedro_package, pandas_package])

        # Assert the values have been set correctly
        assert Metadata.package_compatibilities == [kedro_package, pandas_package]

    def test_metadata_set_has_missing_dependencies(self):
        # Test changing the has_missing_dependencies value
        Metadata.set_has_missing_dependencies(True)
        assert Metadata.has_missing_dependencies is True

        Metadata.set_has_missing_dependencies(False)
        assert Metadata.has_missing_dependencies is False


class TestNodeExtras:
    def test_node_extras_default_values(self):
        """Test that NodeExtras initializes with None values by default"""
        node_extras = NodeExtras()
        assert node_extras.stats is None
        assert node_extras.styles is None

    def test_node_extras_with_stats_only(self):
        """Test NodeExtras creation with only stats data"""
        stats_data = {"rows": 100, "columns": 5, "file_size": "1.2MB"}
        node_extras = NodeExtras(stats=stats_data)

        assert node_extras.stats == stats_data
        assert node_extras.styles is None

    def test_node_extras_with_styles_only(self):
        """Test NodeExtras creation with only styles data"""
        styles_data = {
            "color": "red",
            "themes": {"dark": {"fill": "blue"}, "light": {"fill": "green"}},
        }
        node_extras = NodeExtras(styles=styles_data)

        assert node_extras.styles == styles_data
        assert node_extras.stats is None

    def test_node_extras_with_both_stats_and_styles(self):
        """Test NodeExtras creation with both stats and styles"""
        stats_data = {"rows": 50, "columns": 3}
        styles_data = {"color": "blue", "stroke": "red"}

        node_extras = NodeExtras(stats=stats_data, styles=styles_data)

        assert node_extras.stats == stats_data
        assert node_extras.styles == styles_data

    def test_has_any_extras_returns_false_when_empty(self):
        """Test has_any_extras returns False when no data provided"""
        node_extras = NodeExtras()
        assert node_extras.has_any_extras() is False

    def test_has_any_extras_returns_true_with_stats(self):
        """Test has_any_extras returns True when stats provided"""
        node_extras = NodeExtras(stats={"rows": 10})
        assert node_extras.has_any_extras() is True

    def test_has_any_extras_returns_true_with_styles(self):
        """Test has_any_extras returns True when styles provided"""
        node_extras = NodeExtras(styles={"color": "red"})
        assert node_extras.has_any_extras() is True

    def test_has_any_extras_returns_true_with_both(self):
        """Test has_any_extras returns True when both stats and styles provided"""
        node_extras = NodeExtras(stats={"rows": 10}, styles={"color": "red"})
        assert node_extras.has_any_extras() is True

    def test_get_stats_for_data_node_returns_empty_dict_when_none(self):
        """Test get_stats_for_data_node returns empty dict when stats is None"""
        node_extras = NodeExtras()
        assert node_extras.get_stats_for_data_node() == {}

    def test_get_stats_for_data_node_returns_stats(self):
        """Test get_stats_for_data_node returns stats when available"""
        stats_data = {"rows": 100, "columns": 5}
        node_extras = NodeExtras(stats=stats_data)
        assert node_extras.get_stats_for_data_node() == stats_data

    def test_get_styles_for_graph_node_returns_empty_dict_when_none(self):
        """Test get_styles_for_graph_node returns empty dict when styles is None"""
        node_extras = NodeExtras()
        assert node_extras.get_styles_for_graph_node() == {}

    def test_get_styles_for_graph_node_returns_styles(self):
        """Test get_styles_for_graph_node returns styles when available"""
        styles_data = {"color": "blue", "stroke": "red"}
        node_extras = NodeExtras(styles=styles_data)
        assert node_extras.get_styles_for_graph_node() == styles_data

    @pytest.mark.parametrize(
        "stats,styles,expected_result",
        [
            (None, None, None),
            ({"rows": 10}, None, True),
            (None, {"color": "red"}, True),
            ({"rows": 10}, {"color": "red"}, True),
        ],
    )
    def test_create_node_extras_factory_method(self, stats, styles, expected_result):
        """Test the create_node_extras factory method with various inputs"""
        result = NodeExtras.create_node_extras(stats=stats, styles=styles)

        if expected_result is None:
            assert result is None
        else:
            assert isinstance(result, NodeExtras)
            assert result.stats == stats
            assert result.styles == styles

    def test_create_node_extras_with_complex_nested_styles(self):
        """Test create_node_extras with complex nested styles structure"""
        complex_styles = {
            "color": "primary",
            "themes": {
                "dark": {"fill": "#1f2937", "stroke": "#374151", "text": "#f9fafb"},
                "light": {"fill": "#ffffff", "stroke": "#d1d5db", "text": "#111827"},
            },
        }

        result = NodeExtras.create_node_extras(styles=complex_styles)

        assert result is not None
        assert result.styles == complex_styles
        assert result.get_styles_for_graph_node() == complex_styles

    def test_node_extras_serialization(self):
        """Test that NodeExtras can be properly serialized"""
        stats_data = {"rows": 100, "columns": 5}
        styles_data = {"color": "blue"}

        node_extras = NodeExtras(stats=stats_data, styles=styles_data)
        serialized = node_extras.model_dump()

        expected = {"stats": stats_data, "styles": styles_data}
        assert serialized == expected
