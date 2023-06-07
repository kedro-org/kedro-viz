from kedro.io.data_catalog import DataCatalog

from kedro_viz.data_access.repositories import CatalogRepository


class TestDataCatalogRepository:
    def test_get_layer_mapping_for_transcoded_dataset(self):
        repo = CatalogRepository()
        catalog_config = {
            "cars@pandas": {
                "type": "pandas.CSVDataSet",
                "filepath": "cars.csv",
                "layer": "raw",
            },
        }
        catalog = DataCatalog.from_config(catalog_config)
        repo.set_catalog(catalog)
        assert repo.get_layer_for_dataset("cars") == "raw"
        assert repo.get_layer_for_dataset("cars@pandas") == "raw"

    def test_get_layer_mapping_from_metadata(self):
        repo = CatalogRepository()
        catalog_config = {
            "cars": {
                "type": "pandas.CSVDataSet",
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
        assert repo.get_layer_for_dataset("cars") == "raw"

    # TODO : Update test after Kedro 19 release.
    def test_get_layer_mapping_from_metadata_and_top_level_layer(self):
        repo = CatalogRepository()
        catalog_config = {
            "car_1": {
                "type": "pandas.CSVDataSet",
                "filepath": "cars.csv",
                "metadata": {
                    "kedro-viz": {
                        "layer": "raw",
                    },
                },
            },
            "car_2": {
                "type": "pandas.CSVDataSet",
                "filepath": "cars.csv",
                "layer": "raw",
            },
        }
        catalog = DataCatalog.from_config(catalog_config)
        repo.set_catalog(catalog)
        assert repo.get_layer_for_dataset("car_1") == "raw"
        assert repo.get_layer_for_dataset("car_2") == "raw"
