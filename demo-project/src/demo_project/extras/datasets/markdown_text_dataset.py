"""Custom datasets for the demo project."""

import logging
from kedro_datasets.text.text_dataset import TextDataset

logger = logging.getLogger(__name__)


class MarkdownPreview:
    """Type annotation for Markdown preview in Kedro-Viz."""
    pass


class CustomTextDataset(TextDataset):
    """
    Custom Text dataset that extends TextDataset with preview support for Markdown.
    
    This dataset provides preview functionality that returns MarkdownPreview type,
    which Kedro-Viz will detect and render as markdown content.
    """
    
    def preview(self) -> MarkdownPreview:
        """
        Return text content for preview in Kedro-Viz.
        
        Returns:
            str: Raw text/markdown content for preview
        """
        str_data = self.load()
        
        logger.info(f"Previewing markdown data from {self._filepath}")
        
        return str_data
