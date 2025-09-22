"""Custom datasets for the demo project."""

import logging

from kedro_datasets.text.text_dataset import TextDataset

logger = logging.getLogger(__name__)


class HTMLPreview:
    """Preview type for HTML content."""

    def __init__(self, data: str):
        self.data = data


class CustomTextDataset(TextDataset):
    """
    Custom Text dataset that extends TextDataset with preview support for Markdown.

    This dataset provides preview functionality that returns HTMLPreview type,
    which can be used to display HTML content in Kedro-Viz.
    """

    def preview(self) -> HTMLPreview:
        """
        Return text content for preview in Kedro-Viz.

        Returns:
            str: Raw text/HTML content for preview
        """
        str_data = self.load()

        logger.info(f"Previewing markdown data from {self._filepath}")

        return str_data
