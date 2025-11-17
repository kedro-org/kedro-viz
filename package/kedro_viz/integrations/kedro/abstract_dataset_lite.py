"""``AbstractDatasetLite`` is a custom implementation of Kedro's ``AbstractDataset``
to provide an UnavailableDataset instance when running Kedro-Viz in lite mode.
"""

import logging
from typing import Any, Optional

from kedro.io.core import AbstractDataset, DatasetError

from kedro_viz.integrations.utils import UnavailableDataset

logger = logging.getLogger(__name__)


class AbstractDatasetLite(AbstractDataset):
    """``AbstractDatasetLite`` is a custom implementation of Kedro's ``AbstractDataset``
    to provide an UnavailableDataset instance by overriding ``from_config`` of ``AbstractDataset``
    when running Kedro-Viz in lite mode.
    """

    @classmethod
    def from_config(
        cls: type,
        name: str,
        config: dict[str, Any],
        load_version: Optional[str] = None,
        save_version: Optional[str] = None,
    ) -> AbstractDataset:
        try:
            return AbstractDataset.from_config(name, config, load_version, save_version)
        except DatasetError:
            return UnavailableDataset()
