import pytest
from pydantic import ValidationError

from kedro_viz.models.metadata import Metadata, PackageCompatibility


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
