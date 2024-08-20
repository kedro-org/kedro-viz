import ast
from unittest.mock import MagicMock, patch

import pytest

from kedro_viz.integrations.kedro.lite_parser import LiteParser


@pytest.fixture
def sample_project_path(tmp_path):
    # Create a sample directory structure
    package_dir = tmp_path / "mock_spaceflights"
    package_dir.mkdir()
    (package_dir / "__init__.py").touch()
    (package_dir / "data_processing.py").write_text(
        "import os\nimport nonexistentmodule"
    )
    return tmp_path


@pytest.fixture
def lite_parser(sample_project_path):
    return LiteParser(
        project_path=sample_project_path, package_name="mock_spaceflights"
    )


class TestLiteParser:
    def test_is_module_importable_existing_module(self, lite_parser):
        assert lite_parser._is_module_importable("os") is True

    def test_is_module_importable_nonexistent_module(self, lite_parser):
        assert lite_parser._is_module_importable("nonexistentmodule") is False

    def test_is_module_importable_importerror(self, lite_parser):
        with patch("importlib.util.find_spec", side_effect=ImportError):
            assert lite_parser._is_module_importable("nonexistentmodule") is False

    def test_is_module_importable_modulenotfounderror(self, lite_parser):
        with patch("importlib.util.find_spec", side_effect=ModuleNotFoundError):
            assert lite_parser._is_module_importable("nonexistentmodule") is False

    def test_is_module_importable_valueerror(self, lite_parser):
        with patch("importlib.util.find_spec", side_effect=ValueError):
            assert lite_parser._is_module_importable("nonexistentmodule") is False

    def test_is_relative_import(self, lite_parser):
        assert (
            lite_parser._is_relative_import("mock_spaceflights.data_processing") is True
        )
        assert (
            lite_parser._is_relative_import(
                "mock_spaceflights.data_processing.random_module"
            )
            is False
        )

    def test_create_mock_imports(self, lite_parser):
        mocked_modules = {}
        lite_parser._create_mock_imports("nonexistentmodule", mocked_modules)
        assert "nonexistentmodule" in mocked_modules
        assert isinstance(mocked_modules["nonexistentmodule"], MagicMock)

    def test_populate_mocked_modules(self, lite_parser):
        mocked_modules = {}
        content = (
            "import os\n"
            "import nonexistentmodule\n"
            "from math import sqrt\n"
            "from mock_spaceflights import data_processing\n"
            "from . import some_module\n"
            "# import test"
        )

        parsed_content_ast_node = ast.parse(content)
        lite_parser._populate_mocked_modules(parsed_content_ast_node, mocked_modules)

        assert "nonexistentmodule" in mocked_modules
        assert "os" not in mocked_modules
        assert "math" not in mocked_modules
        assert None not in mocked_modules

    def test_populate_mocked_modules_in_standalone(self, sample_project_path):
        lite_parser_obj = LiteParser(project_path=sample_project_path)
        mocked_modules = {}
        content = (
            "import os\n"
            "import nonexistentmodule\n"
            "from math import sqrt\n"
            "from mock_spaceflights import data_processing\n"
            "from data_processing import some_module\n"
            "# import test"
        )

        parsed_content_ast_node = ast.parse(content)
        lite_parser_obj._populate_mocked_modules(
            parsed_content_ast_node, mocked_modules
        )

        assert "nonexistentmodule" in mocked_modules
        assert "os" not in mocked_modules
        assert "math" not in mocked_modules
        assert "data_processing" not in mocked_modules

    def test_get_mocked_modules(self, lite_parser):
        mocked_modules = lite_parser.get_mocked_modules()

        assert "nonexistentmodule" in mocked_modules
        assert isinstance(mocked_modules["nonexistentmodule"], MagicMock)
        assert "os" not in mocked_modules

    def test_get_mocked_modules_for_non_package_path(self, sample_project_path):
        other_package_dir = sample_project_path / "mock_aircrafts"
        other_package_dir.mkdir()
        (other_package_dir / "__init__.py").touch()
        (other_package_dir / "data_science.py").write_text(
            "import os\nfrom data_processing import datascience_dependency"
        )
        lite_parser_obj = LiteParser(
            project_path=sample_project_path, package_name="mock_spaceflights"
        )
        mocked_modules = lite_parser_obj.get_mocked_modules()

        # dependencies mocked for only files under the package
        # if package name is provided
        assert "data_processing" not in mocked_modules
