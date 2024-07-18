import copy
from typing import Any, Dict

from kedro.io.core import (
    AbstractDataset,
    DatasetError,
    DatasetNotFoundError,
    generate_timestamp,
)
from kedro.io.data_catalog import DataCatalog, Patterns, _resolve_credentials
from kedro.io.memory_dataset import MemoryDataset


class DataCatalogLite(DataCatalog):
    def __init__(
        self,
        datasets: dict[str, AbstractDataset] | None = None,
        feed_dict: dict[str, Any] | None = None,
        dataset_patterns: Dict[str, Dict[str, Any]] | None = None,
        load_versions: dict[str, str] | None = None,
        save_version: str | None = None,
        default_pattern: Dict[str, Dict[str, Any]] | None = None,
    ) -> None:
        super().__init__(
            datasets,
            feed_dict,
            dataset_patterns,
            load_versions,
            save_version,
            default_pattern,
        )

    @classmethod
    def from_config(
        cls,
        catalog: dict[str, dict[str, Any]] | None,
        credentials: dict[str, dict[str, Any]] | None = None,
        load_versions: dict[str, str] | None = None,
        save_version: str | None = None,
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

            ds_config = _resolve_credentials(ds_config, credentials)  # noqa: PLW2901
            if cls._is_pattern(ds_name):
                # Add each factory to the dataset_patterns dict.
                dataset_patterns[ds_name] = ds_config

            else:
                try:
                    datasets[ds_name] = AbstractDataset.from_config(
                        ds_name, ds_config, load_versions.get(ds_name), save_version
                    )
                except DatasetError:
                    datasets[ds_name] = MemoryDataset()

        sorted_patterns = cls._sort_patterns(dataset_patterns)
        if sorted_patterns:
            # If the last pattern is a catch-all pattern, pop it and set it as the default
            if cls._specificity(list(sorted_patterns.keys())[-1]) == 0:
                last_pattern = sorted_patterns.popitem()
                user_default = {last_pattern[0]: last_pattern[1]}

        missing_keys = [
            key
            for key in load_versions.keys()
            if not (key in catalog or cls._match_pattern(sorted_patterns, key))
        ]
        if missing_keys:
            raise DatasetNotFoundError(
                f"'load_versions' keys [{', '.join(sorted(missing_keys))}] "
                f"are not found in the catalog."
            )

        return cls(
            datasets=datasets,
            dataset_patterns=sorted_patterns,
            load_versions=load_versions,
            save_version=save_version,
            default_pattern=user_default,
        )
