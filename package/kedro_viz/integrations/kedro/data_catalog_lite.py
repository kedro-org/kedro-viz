"""``DataCatalogLite`` is a custom implementation of Kedro's ``DataCatalog``
to provide a MemoryDataset instance when running Kedro-Viz in lite mode.
"""

import copy
from typing import Any, Optional

from kedro.io.core import AbstractDataset, DatasetError, generate_timestamp
from kedro.io.data_catalog import DataCatalog, _resolve_credentials

from kedro_viz.integrations.utils import UnavailableDataset


class DataCatalogLite(DataCatalog):
    """``DataCatalogLite`` is a custom implementation of Kedro's ``DataCatalog``
    to provide a MemoryDataset instance by overriding ``from_config`` of ``DataCatalog``
    when running Kedro-Viz in lite mode.
    """

    @classmethod
    def from_config(
        cls,
        catalog: Optional[dict[str, dict[str, Any]]],
        credentials: Optional[dict[str, dict[str, Any]]] = None,
        load_versions: Optional[dict[str, str]] = None,
        save_version: Optional[str] = None,
    ) -> DataCatalog:
        datasets = {}
        dataset_patterns = {}
        catalog = copy.deepcopy(catalog) or {}
        credentials = copy.deepcopy(credentials) or {}
        save_version = save_version or generate_timestamp()
        load_versions = copy.deepcopy(load_versions) or {}
        user_default = {}

        for ds_name, ds_config in catalog.items():
            if not isinstance(ds_config, dict):
                raise DatasetError(
                    f"Catalog entry '{ds_name}' is not a valid dataset configuration. "
                    "\nHint: If this catalog entry is intended for variable interpolation, "
                    "make sure that the key is preceded by an underscore."
                )

            try:
                ds_config = _resolve_credentials(
                    ds_config, credentials
                )  # noqa: PLW2901
                if cls._is_pattern(ds_name):
                    # Add each factory to the dataset_patterns dict.
                    dataset_patterns[ds_name] = ds_config

                else:
                    try:
                        datasets[ds_name] = AbstractDataset.from_config(
                            ds_name, ds_config, load_versions.get(ds_name), save_version
                        )
                    except DatasetError:
                        datasets[ds_name] = UnavailableDataset()
            except KeyError:
                datasets[ds_name] = UnavailableDataset()

        sorted_patterns = cls._sort_patterns(dataset_patterns)
        if sorted_patterns:
            # If the last pattern is a catch-all pattern, pop it and set it as the default
            if cls._specificity(list(sorted_patterns.keys())[-1]) == 0:
                last_pattern = sorted_patterns.popitem()
                user_default = {last_pattern[0]: last_pattern[1]}

        try:
            return cls(
                datasets=datasets,
                dataset_patterns=sorted_patterns,
                load_versions=load_versions,
                save_version=save_version,
                default_pattern=user_default,
            )
        except TypeError:
            # support for Kedro < 0.19.6
            # DataCatalog does not have default_pattern
            return cls(
                datasets=datasets,
                dataset_patterns=sorted_patterns,
                load_versions=load_versions,
                save_version=save_version,
            )
