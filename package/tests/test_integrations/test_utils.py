"""Tests for `kedro_viz.integrations.utils`."""

from kedro.io import DataCatalog
from kedro.io.core import DatasetError

from kedro_viz.integrations.utils import UnavailableDataset, get_dataset_lite_safe


def test_get_dataset_lite_safe_recovers_from_non_dataset_error(mocker):
    """A failure that isn't a DatasetError (e.g. a native extension aborting) still
    degrades to UnavailableDataset in lite mode instead of propagating."""
    catalog = DataCatalog()
    mocker.patch.object(catalog, "get", side_effect=RuntimeError("broken"))

    dataset = get_dataset_lite_safe(catalog, "broken", is_lite=True)

    assert isinstance(dataset, UnavailableDataset)
    assert dataset.reason == "broken"


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


def test_get_dataset_lite_safe_preserves_declared_layer_metadata():
    """A dataset's declared kedro-viz metadata (e.g. layer) survives on the
    UnavailableDataset placeholder, even though the dataset itself couldn't load."""
    catalog = DataCatalog.from_config(
        {
            "broken": {
                "type": "totally_missing_module_for_lite_test.NoSuchDataset",
                "metadata": {"kedro-viz": {"layer": "raw"}},
            }
        }
    )

    dataset = get_dataset_lite_safe(catalog, "broken", is_lite=True)

    assert isinstance(dataset, UnavailableDataset)
    assert dataset.metadata == {"kedro-viz": {"layer": "raw"}}


def test_get_dataset_lite_safe_ignores_metadata_lookup_failure(mocker):
    """A failure reading the declared metadata back from the catalog config still
    returns a usable placeholder, just without that metadata."""
    catalog = DataCatalog()
    mocker.patch.object(catalog, "get", side_effect=DatasetError("missing dependency"))
    mocker.patch.object(
        type(catalog.config_resolver),
        "config",
        new_callable=mocker.PropertyMock,
        side_effect=RuntimeError("broken"),
    )

    dataset = get_dataset_lite_safe(catalog, "broken", is_lite=True)

    assert isinstance(dataset, UnavailableDataset)
    assert dataset.metadata is None
