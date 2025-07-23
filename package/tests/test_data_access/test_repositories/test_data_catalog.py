import pytest
from kedro.io import DataCatalog, MemoryDataset
from kedro.io.core import AbstractDataset, DatasetNotFoundError
from kedro.pipeline import node, pipeline
from kedro_datasets.pandas import CSVDataset
from packaging.version import parse

from kedro_viz.data_access.managers import DataAccessManager
from kedro_viz.data_access.repositories import CatalogRepository


@pytest.fixture
def mock_data_repo():
    repo = CatalogRepository()
    catalog_config = {
        "my_dataset": {
            "type": "pandas.CSVDataset",
            "filepath": "cars.csv",
        }
    }
    catalog = DataCatalog.from_config(catalog_config)
    repo.set_catalog(catalog)

    yield repo


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

    def test_get_dataset_with_get(self, mock_data_repo):
        result = mock_data_repo.get_dataset("my_dataset")
        assert isinstance(result, CSVDataset)

    def test_get_dataset_returns_none(self, mock_data_repo, mocker):
        # Simulate .get returning None
        mocker.patch.object(
            mock_data_repo._catalog,
            "get",
            return_value=None,
        )

        result = mock_data_repo.get_dataset("my_dataset")
        assert isinstance(result, MemoryDataset)


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

    def test_layers_mapping_uses_metadata_layer(self):
        catalog_config = {
            "my_dataset": {
                "type": "pandas.CSVDataset",
                "filepath": "my.csv",
                "metadata": {"kedro-viz": {"layer": "my_layer"}},
            }
        }
        catalog = DataCatalog.from_config(catalog_config)
        repo = CatalogRepository()
        repo.set_catalog(catalog)

        layers_map = repo.layers_mapping

        assert layers_map["my_dataset"] == "my_layer"
