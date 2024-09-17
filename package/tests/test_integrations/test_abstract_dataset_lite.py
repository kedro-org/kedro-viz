from unittest.mock import Mock, patch

import pytest
from kedro.io.core import DatasetError

from kedro_viz.integrations.kedro.abstract_dataset_lite import AbstractDatasetLite
from kedro_viz.integrations.utils import UnavailableDataset


@pytest.fixture
def filepath(tmp_path):
    return (tmp_path / "some" / "dir" / "test.csv").as_posix()


def test_from_config_success(filepath):
    with patch("kedro.io.core.AbstractDataset.from_config") as mock_from_config:
        mock_dataset = Mock()
        mock_from_config.return_value = mock_dataset

        # Call the method
        result = AbstractDatasetLite.from_config(
            name="boats",
            config={"type": "pandas.CSVDataset", "filepath": filepath},
            load_version=None,
            save_version=None,
        )

        # Assert that the result is the mock dataset
        assert result == mock_dataset
        mock_from_config.assert_called_once_with(
            "boats", {"type": "pandas.CSVDataset", "filepath": filepath}, None, None
        )


def test_from_config_failure():
    with patch(
        "kedro.io.core.AbstractDataset.from_config",
        side_effect=DatasetError(
            "An exception occurred when parsing config of a dataset"
        ),
    ) as mock_from_config:
        # Call the method
        result = AbstractDatasetLite.from_config(
            name="boats",
            config={"type": "pandas.CSVDataset", "filepath": filepath},
            load_version=None,
            save_version=None,
        )

        # Assert that UnavailableDataset is returned
        assert isinstance(result, UnavailableDataset)
        mock_from_config.assert_called_once_with(
            "boats", {"type": "pandas.CSVDataset", "filepath": filepath}, None, None
        )
