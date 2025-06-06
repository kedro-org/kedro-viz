from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from kedro_viz.integrations.kedro.lite_parser import LiteParser


@pytest.fixture
def mock_spinner():
    with patch("kedro_viz.integrations.kedro.lite_parser.Spinner") as mock:
        mock.return_value.__enter__.return_value = mock
        yield mock


@pytest.fixture
def sample_project_path(tmp_path):
    # Create a sample directory structure
    package_dir = tmp_path / "mock_spaceflights"
    package_dir.mkdir()

    venv_dir = package_dir / ".venv"
    venv_dir.mkdir()

    (package_dir / "__init__.py").touch()
    (package_dir / "__init__.py").write_text(
        "from mock_spaceflights import data_processing\n"
        "from mock_spaceflights.data_processing import create_metrics"
    )
    (package_dir / ".test_hidden.py").write_text(
        "import os\n"
        "import nonexistentmodule\n"
        "from . import test\n"
        "from typing import Dict"
    )
    (venv_dir / "test_venv.py").write_text(
        "import os\n"
        "import nonexistentmodule\n"
        "from . import test\n"
        "from typing import Dict"
    )
    (package_dir / "data_processing.py").write_text(
        "import os\n"
        "import nonexistentmodule\n"
        "from . import test\n"
        "from typing import Dict"
    )
    (package_dir / ".gitignore").write_text("venv\n.venv")
    return tmp_path


@pytest.fixture
def lite_parser():
    return LiteParser(package_name="mock_spaceflights")


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

    @pytest.mark.parametrize(
        "module_name, expected_module_parts",
        [
            ("sklearn", ["sklearn"]),
            (
                "demo_project.pipelines.ingestion",
                [
                    "demo_project",
                    "demo_project.pipelines",
                    "demo_project.pipelines.ingestion",
                ],
            ),
        ],
    )
    def test_get_module_parts(self, lite_parser, module_name, expected_module_parts):
        assert lite_parser._get_module_parts(module_name) == expected_module_parts

    def test_is_relative_import_found(self, lite_parser):
        module_name = "kedro_project_package.pipelines.reporting.nodes"
        project_file_paths = {
            Path("/path/to/kedro_project_package/pipelines/reporting/nodes.py")
        }
        assert lite_parser._is_relative_import(module_name, project_file_paths)

    def test_relative_import_not_found(self, lite_parser):
        module_name = "kedro_project_package.pipelines.reporting.nodes"
        project_file_paths = {
            Path("/path/to/another_project/pipelines/reporting/nodes.py")
        }
        assert not lite_parser._is_relative_import(module_name, project_file_paths)

    def test_relative_import_partial_match(self, lite_parser):
        module_name = "kedro_project_package.pipelines"
        project_file_paths = {
            Path("/path/to/kedro_project_package/pipelines/reporting/nodes.py"),
            Path("/path/to/kedro_project_package/pipelines/something_else.py"),
        }
        assert lite_parser._is_relative_import(module_name, project_file_paths)

    def test_relative_import_empty_file_paths(self, lite_parser):
        module_name = "kedro_project_package.pipelines.reporting.nodes"
        project_file_paths = set()
        assert not lite_parser._is_relative_import(module_name, project_file_paths)

    def test_populate_missing_dependencies(self, lite_parser):
        module_name = "non_importable.module.part"
        missing_dependencies = set()

        lite_parser._populate_missing_dependencies(module_name, missing_dependencies)

        # The test expects the missing dependencies to
        # include each part of the module name
        expected_missing = {
            "non_importable",
            "non_importable.module",
            "non_importable.module.part",
        }
        assert missing_dependencies == expected_missing

    def test_no_missing_dependencies(self, lite_parser, mocker):
        module_name = "importable_module"
        missing_dependencies = set()
        mocker.patch(
            "kedro_viz.integrations.kedro.lite_parser.LiteParser._is_module_importable",
            return_value=True,
        )

        lite_parser._populate_missing_dependencies(module_name, missing_dependencies)

        # Since the module is importable,
        # the set should remain empty
        assert not missing_dependencies

    def test_partial_importability(self, lite_parser, mocker):
        module_name = "importable_module.non_importable_part"
        missing_dependencies = set()
        mocker.patch(
            "kedro_viz.integrations.kedro.lite_parser.LiteParser._is_module_importable",
            side_effect=lambda part: part == "importable_module",
        )

        lite_parser._populate_missing_dependencies(module_name, missing_dependencies)

        # Only the non-importable part
        # should be added to the set
        expected_missing = {"importable_module.non_importable_part"}
        assert missing_dependencies == expected_missing

    def test_get_unresolved_imports(self, lite_parser, sample_project_path, mocker):
        file_path = Path(sample_project_path / "mock_spaceflights/data_processing.py")
        mock_populate = mocker.patch(
            "kedro_viz.integrations.kedro.lite_parser.LiteParser._populate_missing_dependencies"
        )

        lite_parser._get_unresolved_imports(file_path)

        # Ensure _populate_missing_dependencies was called
        # with correct module names
        mock_populate.assert_any_call("os", set())
        mock_populate.assert_any_call("nonexistentmodule", set())

    def test_get_unresolved_relative_imports(self, sample_project_path, mocker):
        lite_parser_obj = LiteParser()
        file_path = Path(sample_project_path / "mock_spaceflights/__init__.py")

        unresolvable_imports = lite_parser_obj._get_unresolved_imports(
            file_path, set(sample_project_path.rglob("*.py"))
        )

        assert len(unresolvable_imports) == 0

    def test_create_mock_modules(self, lite_parser):
        unresolved_imports = {"sklearn", "pyspark.pandas"}
        mocked_modules = lite_parser.create_mock_modules(unresolved_imports)

        assert len(mocked_modules) == len(unresolved_imports)
        assert "sklearn" in mocked_modules
        assert "pyspark.pandas" in mocked_modules
        assert isinstance(mocked_modules["sklearn"], MagicMock)

    def test_parse_non_existent_path(self, lite_parser, mock_spinner):
        assert not lite_parser.parse(Path("non/existent/path"))
        assert not lite_parser.parse(Path("non/existent/path/file.py"))

    def test_parse_hidden_file_path(
        self, lite_parser, sample_project_path, mock_spinner
    ):
        file_path = Path(sample_project_path / "mock_spaceflights/.test_hidden.py")

        unresolved_imports = lite_parser.parse(file_path)
        assert unresolved_imports == {}

    def test_file_parse(self, lite_parser, sample_project_path, mock_spinner):
        file_path = Path(sample_project_path / "mock_spaceflights/data_processing.py")
        unresolved_imports = lite_parser.parse(file_path)

        assert unresolved_imports == {str(file_path): {"nonexistentmodule"}}

    def test_parse_logs_error_on_exception(
        self, lite_parser, tmp_path, caplog, mock_spinner
    ):
        file_path = Path(tmp_path / "mock_spaceflights/data_processing_non_utf.py")
        file_path.parent.mkdir(parents=True, exist_ok=True)

        # Write non-UTF characters (e.g., using ISO-8859-1 encoding)
        non_utf_content = "This is a test with non-UTF characters: é, ñ, ü"

        # Write the file in ISO-8859-1 encoding
        with open(file_path, "w", encoding="ISO-8859-1") as f:
            f.write(non_utf_content)

        assert file_path.exists()

        lite_parser.parse(file_path)
        assert (
            f"An error occurred in LiteParser while mocking dependencies in {str(file_path)}"
            in caplog.text
        )

    def test_directory_parse(self, lite_parser, sample_project_path, mock_spinner):
        unresolved_imports = lite_parser.parse(
            sample_project_path / "mock_spaceflights"
        )
        expected_file_path = Path(
            sample_project_path / "mock_spaceflights/data_processing.py"
        )
        assert unresolved_imports == {str(expected_file_path): {"nonexistentmodule"}}

    def test_directory_parse_non_package_path(self, sample_project_path, mock_spinner):
        lite_parser_obj = LiteParser("mock_pyspark")
        unresolvable_imports = lite_parser_obj.parse(sample_project_path)

        # ignore files in other packages if
        # LiteParser is instantiated with a package_name
        assert len(unresolvable_imports) == 0
