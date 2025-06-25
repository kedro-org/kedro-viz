import pytest
from kedro.io import DataCatalog, MemoryDataset
from kedro.pipeline import node, pipeline

from kedro_viz.data_access.managers import DataAccessManager

try:
    from kedro.io import KedroDataCatalog  # type: ignore[attr-defined]

    HAS_KEDRO_DATA_CATALOG = True
except ImportError:
    HAS_KEDRO_DATA_CATALOG = False

from packaging.version import parse

from kedro_viz.data_access.repositories import CatalogRepository


class TestDataCatalogRepository:
    def test_get_layer_mapping_for_transcoded_dataset(self):
        repo = CatalogRepository()
        catalog_config = {
            "cars@pandas": {
                "type": "pandas.CSVDataset",
                "filepath": "cars.csv",
                "metadata": {"kedro-viz": {"layer": "raw"}},
            }
        }
        catalog = DataCatalog.from_config(catalog_config)
        repo.set_catalog(catalog)
        assert repo.get_layer_for_dataset("cars") == "raw"
        assert repo.get_layer_for_dataset("cars@pandas") == "raw"

    def test_layers_mapping_for_dataset_factories(
        self, data_access_manager: DataAccessManager
    ):
        catalog_repo = CatalogRepository()
        catalog_config = {
            "{namespace}.int_{name}": {
                "type": "pandas.CSVDataset",
                "filepath": "{name}.csv",
                "metadata": {"kedro-viz": {"layer": "factory_test"}},
            },
            "cars": {
                "type": "pandas.CSVDataset",
                "filepath": "cars.csv",
                "metadata": {"kedro-viz": {"layer": "raw"}},
            },
        }
        processing_pipeline = pipeline(
            [
                node(
                    lambda x: x,
                    inputs=["int_companies"],
                    outputs="prm_agg_companies",
                    name="process_data",
                )
            ],
            namespace="processing",
            outputs="prm_agg_companies",
        )
        catalog = DataCatalog.from_config(catalog_config)
        catalog_repo.set_catalog(catalog)

        assert "raw" in catalog_repo.layers_mapping.values()
        assert "factory_test" not in catalog_repo.layers_mapping.values()

        # clear mapping
        catalog_repo._layers_mapping = None

        data_access_manager.resolve_dataset_factory_patterns(
            catalog, {"__default__": processing_pipeline}
        )

        assert "raw" in catalog_repo.layers_mapping.values()
        assert "factory_test" in catalog_repo.layers_mapping.values()

    def test_validate_layers_error(self):
        repo = CatalogRepository()
        catalog_config = {
            "car@pandas1": {
                "type": "pandas.CSVDataset",
                "filepath": "cars.csv",
                "metadata": {
                    "kedro-viz": {
                        "layer": "raw",
                    },
                },
            },
            "car@pandas2": {
                "type": "pandas.ParquetDataset",
                "filepath": "cars.pq",
                "metadata": {
                    "kedro-viz": {
                        "layer": "intermediate",
                    },
                },
            },
        }
        catalog = DataCatalog.from_config(catalog_config)
        repo.set_catalog(catalog)
        with pytest.raises(
            ValueError,
            match=r"Transcoded datasets should have the same layer. "
            "Please ensure consistent layering in your Kedro catalog. "
            "Mismatch found for: ",
        ):
            repo.get_layer_for_dataset("car@pandas1")

    def test_get_layer_mapping_from_metadata(self):
        repo = CatalogRepository()
        catalog_config = {
            "car@pandas1": {
                "type": "pandas.CSVDataset",
                "filepath": "cars.csv",
                "metadata": {
                    "kedro-viz": {
                        "layer": "raw",
                    },
                },
            },
        }
        catalog = DataCatalog.from_config(catalog_config)
        repo.set_catalog(catalog)
        assert repo.get_layer_for_dataset("car") == "raw"


class TestDataCatalogRepositoryExtended:
    def test_dataset_no_metadata(self):
        """
        Covers lines where dataset has no 'metadata' attribute,
        so the code in layers_mapping sees 'metadata' is None and skips logic.
        """
        repo = CatalogRepository()
        catalog_config = {
            "cars@pandas": {
                "type": "pandas.CSVDataset",
                "filepath": "cars.csv",
                # No 'metadata' here
            }
        }
        catalog = DataCatalog.from_config(catalog_config)
        repo.set_catalog(catalog)
        # Should return None since no layer is found
        assert repo.get_layer_for_dataset("cars") is None

    @pytest.mark.parametrize(
        "kedro_version_str, expected_layer, add_layers_attr, metadata_layer",
        [
            # Simulate old Kedro (< 0.19.0)
            ("0.18.9", None, True, None),
            # Simulate new Kedro (>= 0.19.0)
            ("0.19.1", "my_layer", False, "my_layer"),
        ],
    )
    def test_layers_mapping_various_versions(
        self, kedro_version_str, expected_layer, add_layers_attr, metadata_layer, mocker
    ):
        mocker.patch(
            "kedro_viz.data_access.repositories.catalog.KEDRO_VERSION",
            parse(kedro_version_str),
        )

        repo = CatalogRepository()
        if metadata_layer:
            # For new Kedro: rely on metadata
            catalog_config = {
                "my_dataset": {
                    "type": "pandas.CSVDataset",
                    "filepath": "my.csv",
                    "metadata": {"kedro-viz": {"layer": metadata_layer}},
                }
            }
            catalog = DataCatalog.from_config(catalog_config)
        else:
            # For old Kedro: no metadata
            catalog = DataCatalog({"my_dataset": MemoryDataset()})

        # Simulating old Kedro
        if add_layers_attr:
            catalog.layers = None

        repo.set_catalog(catalog)
        layers_map = repo.layers_mapping

        # Now "my_dataset" should map to expected_layer
        assert layers_map["my_dataset"] == expected_layer
