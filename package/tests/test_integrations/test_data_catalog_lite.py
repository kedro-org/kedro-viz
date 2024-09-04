import logging
import re
import sys
from copy import deepcopy

import pandas as pd
import pytest
from kedro.io import DatasetError
from kedro_datasets.pandas import CSVDataset
from pandas.testing import assert_frame_equal

from kedro_viz.integrations.kedro.data_catalog_lite import DataCatalogLite


@pytest.fixture
def filepath(tmp_path):
    return (tmp_path / "some" / "dir" / "test.csv").as_posix()


@pytest.fixture
def dummy_dataframe():
    return pd.DataFrame({"col1": [1, 2], "col2": [4, 5], "col3": [5, 6]})


@pytest.fixture
def sane_config(filepath):
    return {
        "catalog": {
            "boats": {"type": "pandas.CSVDataset", "filepath": filepath},
            "cars": {
                "type": "pandas.CSVDataset",
                "filepath": "s3://test_bucket/test_file.csv",
                "credentials": "s3_credentials",
            },
        },
        "credentials": {
            "s3_credentials": {"key": "FAKE_ACCESS_KEY", "secret": "FAKE_SECRET_KEY"}
        },
    }


@pytest.fixture
def sane_config_with_nested_creds(sane_config):
    sane_config["catalog"]["cars"]["credentials"] = {
        "client_kwargs": {"credentials": "other_credentials"},
        "key": "secret",
    }
    sane_config["credentials"]["other_credentials"] = {
        "client_kwargs": {
            "aws_access_key_id": "OTHER_FAKE_ACCESS_KEY",
            "aws_secret_access_key": "OTHER_FAKE_SECRET_KEY",
        }
    }
    return sane_config


@pytest.fixture
def config_with_dataset_factories():
    return {
        "catalog": {
            "{brand}_cars": {
                "type": "pandas.CSVDataset",
                "filepath": "data/01_raw/{brand}_cars.csv",
            },
            "audi_cars": {
                "type": "pandas.ParquetDataset",
                "filepath": "data/01_raw/audi_cars.pq",
            },
            "{type}_boats": {
                "type": "pandas.CSVDataset",
                "filepath": "data/01_raw/{type}_boats.csv",
            },
            "{default1}": {
                "type": "pandas.CSVDataset",
                "filepath": "data/01_raw/{default1}.csv",
            },
        },
    }


@pytest.fixture
def bad_config(filepath):
    return {
        "bad": {"type": "tests.io.test_data_catalog.BadDataset", "filepath": filepath}
    }


@pytest.fixture
def data_catalog_lite_from_config(sane_config):
    return DataCatalogLite.from_config(**sane_config)


class TestDataCatalogLiteFromConfig:
    def test_from_sane_config(
        self, data_catalog_lite_from_config, dummy_dataframe, sane_config, mocker
    ):
        """Test populating the data catalog from config"""
        data_catalog_lite_from_config.save("boats", dummy_dataframe)
        reloaded_df = data_catalog_lite_from_config.load("boats")
        assert_frame_equal(reloaded_df, dummy_dataframe)

        # testing error handling
        mocker.patch(
            "kedro_viz.integrations.kedro.data_catalog_lite.DataCatalog.__init__",
            side_effect=[TypeError, None],
        )

        try:
            DataCatalogLite.from_config(**sane_config)
        except TypeError:
            pytest.fail("TypeError was not handled by from_config method")

    def test_config_missing_type(self, sane_config):
        """Check for no error if type attribute is missing for some data set(s)
        in the config"""
        del sane_config["catalog"]["boats"]["type"]
        try:
            # DataCatalogLite should not raise DatasetError
            DataCatalogLite.from_config(**sane_config)
        except DatasetError:
            pytest.fail("DataCatalogLite.from_config raised DatasetError unexpectedly")

    def test_config_invalid_module(self, sane_config):
        """Check for no error if the type points to nonexistent module"""

        sane_config["catalog"]["boats"][
            "type"
        ] = "kedro.invalid_module_name.io.CSVDataset"

        try:
            # DataCatalogLite should not raise DatasetError
            DataCatalogLite.from_config(**sane_config)
        except DatasetError:
            pytest.fail("DataCatalogLite.from_config raised DatasetError unexpectedly")

    def test_config_relative_import(self, sane_config):
        """Check for no error if the type points to a relative import"""
        sane_config["catalog"]["boats"]["type"] = ".CSVDatasetInvalid"

        try:
            # DataCatalogLite should not raise DatasetError
            DataCatalogLite.from_config(**sane_config)
        except DatasetError:
            pytest.fail("DataCatalogLite.from_config raised DatasetError unexpectedly")

    def test_config_missing_class(self, sane_config):
        """Check for no error if the type points to nonexistent class"""
        sane_config["catalog"]["boats"]["type"] = "kedro.io.CSVDatasetInvalid"

        try:
            # DataCatalogLite should not raise DatasetError
            DataCatalogLite.from_config(**sane_config)
        except DatasetError:
            pytest.fail("DataCatalogLite.from_config raised DatasetError unexpectedly")

    @pytest.mark.skipif(
        sys.version_info < (3, 9),
        reason="for python 3.8 kedro-datasets version 1.8 is used which has the old spelling",
    )
    def test_config_incorrect_spelling(self, sane_config):
        """Check hint if the type uses the old DataSet spelling"""
        sane_config["catalog"]["boats"]["type"] = "pandas.CSVDataSet"

        try:
            # DataCatalogLite should not raise DatasetError
            DataCatalogLite.from_config(**sane_config)
        except DatasetError:
            pytest.fail("DataCatalogLite.from_config raised DatasetError unexpectedly")

    def test_config_invalid_dataset(self, sane_config):
        """Check for no error if the type points to invalid class"""
        sane_config["catalog"]["boats"]["type"] = "DataCatalogLite"

        try:
            # DataCatalogLite should not raise DatasetError
            DataCatalogLite.from_config(**sane_config)
        except DatasetError:
            pytest.fail("DataCatalogLite.from_config raised DatasetError unexpectedly")

    def test_config_invalid_arguments(self, sane_config):
        """Check for no error if the data set config contains invalid arguments"""
        sane_config["catalog"]["boats"]["save_and_load_args"] = False

        try:
            # DataCatalogLite should not raise DatasetError
            DataCatalogLite.from_config(**sane_config)
        except DatasetError:
            pytest.fail("DataCatalogLite.from_config raised DatasetError unexpectedly")

    def test_config_invalid_dataset_config(self, sane_config):
        """Check for valid config"""
        sane_config["catalog"]["invalid_entry"] = "some string"
        pattern = (
            "Catalog entry 'invalid_entry' is not a valid dataset configuration. "
            "\nHint: If this catalog entry is intended for variable interpolation, "
            "make sure that the key is preceded by an underscore."
        )
        with pytest.raises(DatasetError, match=pattern):
            DataCatalogLite.from_config(**sane_config)

    def test_empty_config(self):
        """Test empty config"""
        assert DataCatalogLite.from_config(None)

    def test_missing_credentials(self, sane_config):
        """Check for no error if credentials can't be located"""
        sane_config["catalog"]["cars"]["credentials"] = "missing"

        try:
            # DataCatalogLite should not raise KeyError
            DataCatalogLite.from_config(**sane_config)
        except DatasetError:
            pytest.fail("DataCatalogLite.from_config raised KeyError unexpectedly")

    def test_link_credentials(self, sane_config, mocker):
        """Test credentials being linked to the relevant data set"""
        mock_client = mocker.patch("kedro_datasets.pandas.csv_dataset.fsspec")
        config = deepcopy(sane_config)
        del config["catalog"]["boats"]

        DataCatalogLite.from_config(**config)

        expected_client_kwargs = sane_config["credentials"]["s3_credentials"]
        mock_client.filesystem.assert_called_with("s3", **expected_client_kwargs)

    def test_nested_credentials(self, sane_config_with_nested_creds, mocker):
        mock_client = mocker.patch("kedro_datasets.pandas.csv_dataset.fsspec")
        config = deepcopy(sane_config_with_nested_creds)
        del config["catalog"]["boats"]
        DataCatalogLite.from_config(**config)

        expected_client_kwargs = {
            "client_kwargs": {
                "credentials": {
                    "client_kwargs": {
                        "aws_access_key_id": "OTHER_FAKE_ACCESS_KEY",
                        "aws_secret_access_key": "OTHER_FAKE_SECRET_KEY",
                    }
                }
            },
            "key": "secret",
        }
        mock_client.filesystem.assert_called_once_with("s3", **expected_client_kwargs)

    def test_missing_nested_credentials(self, sane_config_with_nested_creds):
        """Check for no error if credentials are missing from nested credentials"""
        del sane_config_with_nested_creds["credentials"]["other_credentials"]

        try:
            # DataCatalogLite should not raise KeyError
            DataCatalogLite.from_config(**sane_config_with_nested_creds)
        except DatasetError:
            pytest.fail("DataCatalogLite.from_config raised KeyError unexpectedly")

    def test_missing_dependency(self, sane_config, mocker):
        """Test that no error is thrown when a dependency is missing."""
        pattern = "dependency issue"

        def dummy_load(obj_path, *args, **kwargs):
            if obj_path == "kedro_datasets.pandas.CSVDataset":
                raise AttributeError(pattern)
            if obj_path == "kedro_datasets.pandas.__all__":
                return ["CSVDataset"]
            return None

        mocker.patch("kedro.io.core.load_obj", side_effect=dummy_load)

        try:
            # DataCatalogLite should not raise DatasetError
            DataCatalogLite.from_config(**sane_config)
        except DatasetError:
            pytest.fail("DataCatalogLite.from_config raised DatasetError unexpectedly")

    def test_idempotent_catalog(self, sane_config):
        """Test that data catalog instantiations are idempotent"""
        _ = DataCatalogLite.from_config(**sane_config)
        catalog = DataCatalogLite.from_config(**sane_config)
        assert catalog

    def test_error_dataset_init(self, bad_config):
        """Check for no error when trying to instantiate erroneous data set"""
        try:
            # DataCatalogLite should not raise DatasetError
            DataCatalogLite.from_config(bad_config)
        except DatasetError:
            pytest.fail("DataCatalogLite.from_config raised DatasetError unexpectedly")

    def test_confirm(self, tmp_path, caplog, mocker):
        """Confirm the dataset"""
        with caplog.at_level(logging.INFO):
            mock_confirm = mocker.patch(
                "kedro_datasets.partitions.incremental_dataset.IncrementalDataset.confirm"
            )
            catalog = {
                "ds_to_confirm": {
                    "type": "kedro_datasets.partitions.incremental_dataset.IncrementalDataset",
                    "dataset": "pandas.CSVDataset",
                    "path": str(tmp_path),
                }
            }
            data_catalog = DataCatalogLite.from_config(catalog=catalog)
            data_catalog.confirm("ds_to_confirm")
            assert caplog.record_tuples == [
                (
                    "kedro.io.data_catalog",
                    logging.INFO,
                    "Confirming dataset 'ds_to_confirm'",
                )
            ]
            mock_confirm.assert_called_once_with()

    @pytest.mark.parametrize(
        "dataset_name,pattern",
        [
            ("missing", "Dataset 'missing' not found in the catalog"),
            ("boats", "Dataset 'boats' does not have 'confirm' method"),
        ],
    )
    def test_bad_confirm(self, sane_config, dataset_name, pattern):
        """Test confirming non existent dataset or the one that
        does not have `confirm` method"""
        data_catalog_lite = DataCatalogLite.from_config(**sane_config)

        with pytest.raises(DatasetError, match=re.escape(pattern)):
            data_catalog_lite.confirm(dataset_name)

    def test_match_added_to_datasets_on_get(self, config_with_dataset_factories):
        """Check that the datasets that match patterns are only added when fetched"""
        catalog = DataCatalogLite.from_config(**config_with_dataset_factories)
        assert "{brand}_cars" not in catalog._datasets
        assert "tesla_cars" not in catalog._datasets
        assert "{brand}_cars" in catalog._dataset_patterns

        tesla_cars = catalog._get_dataset("tesla_cars")
        assert isinstance(tesla_cars, CSVDataset)
        assert "tesla_cars" in catalog._datasets
