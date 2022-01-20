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
            "cars@spark": {"type": "spark.SparkDataSet", "filepath": "cars.parquet"},
        }
        catalog = DataCatalog.from_config(catalog_config)
        repo.set_catalog(catalog)
        assert repo.get_layer_for_dataset("cars") == "raw"
        assert repo.get_layer_for_dataset("cars@pandas") == "raw"
        assert repo.get_layer_for_dataset("cars@spark") == "raw"
