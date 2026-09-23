"""Tests for `kedro_viz.integrations.utils`."""

from kedro.io import DataCatalog
from kedro.io.core import DatasetError

from kedro_viz.integrations.utils import UnavailableDataset, get_dataset_lite_safe


def test_get_dataset_lite_safe_recovers_from_non_dataset_error(mocker):
    """A failure that isn't a DatasetError (e.g. a native extension aborting) still
    degrades to UnavailableDataset in lite mode instead of propagating."""
    catalog = DataCatalog()
    mocker.patch.object(catalog, "get", side_effect=RuntimeError("boom"))

    dataset = get_dataset_lite_safe(catalog, "broken", is_lite=True)

    assert isinstance(dataset, UnavailableDataset)
    assert dataset.reason is None


def test_get_dataset_lite_safe_returns_placeholder_even_if_caching_fails(mocker):
    """If writing the placeholder back into the catalog itself fails, the caller
    still gets an UnavailableDataset back instead of an exception."""
    catalog = DataCatalog()
    mocker.patch.object(catalog, "get", side_effect=DatasetError("missing dependency"))
    mocker.patch.object(
        DataCatalog, "__setitem__", side_effect=RuntimeError("cannot cache")
    )

    dataset = get_dataset_lite_safe(catalog, "broken", is_lite=True)

    assert isinstance(dataset, UnavailableDataset)
    assert dataset.reason == "missing dependency"
