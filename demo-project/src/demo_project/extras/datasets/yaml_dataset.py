"""Custom YAML dataset for testing Kedro-Viz preview functionality."""

from kedro_datasets.yaml import YAMLDataset
from typing import Any


class YAMLPreview:
    """Type annotation for YAML preview in Kedro-Viz."""
    pass


class CustomYAMLDataset(YAMLDataset):
    """
    Custom YAML dataset that extends YAMLDataset with preview support.
    
    This dataset is designed to test Kedro-Viz's ability to handle custom
    preview types. It returns YAML content formatted as a string for preview.
    """
    
    def preview(self) -> YAMLPreview:
        """
        Return YAML content for preview in Kedro-Viz.
        
        Returns:
            str: YAML content formatted as a string that will be displayed in the preview panel.
        """
        try:
            # Load the YAML data
            data = self.load()
            
            # Convert back to YAML string for preview
            import yaml
            yaml_content = yaml.dump(
                data, 
                default_flow_style=False, 
                sort_keys=False,
                indent=2,
                allow_unicode=True
            )
            
            return yaml_content
            
        except Exception as e:
            return f"Could not load YAML content: {str(e)}"
