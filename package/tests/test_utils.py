import pytest
from kedro_viz.utils import file_extension_filter

@pytest.mark.parametrize(
    "file_path, expected",
    [
        ("config.yml", True),
        ("config.yaml", True),
        ("script.py", True),
        ("data.json", True),
        ("image.png", False),
        ("document.txt", False),
        ("archive.zip", False),
    ],
)
def test_file_extension_filter(file_path, expected):
    assert file_extension_filter(None, file_path) == expected