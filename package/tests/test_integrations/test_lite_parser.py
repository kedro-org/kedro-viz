import ast
from pathlib import Path
from unittest.mock import MagicMock

import pytest

from kedro_viz.integrations.kedro.lite_parser import LiteParser


class TestLiteParser:
    def test_get_import_statements_from_ast(self):
        content = (
            "import os\n"
            "import sys\n"
            "from pathlib import Path\n"
            "from collections import namedtuple\n"
            "# import test"
        )
        parsed_content_ast_node = ast.parse(content)
        expected_imports = [
            "import os",
            "import sys",
            "from pathlib import Path",
            "from collections import namedtuple",
        ]
        assert (
            LiteParser._get_import_statements_from_ast(parsed_content_ast_node)
            == expected_imports
        )

    def test_is_module_importable(self):
        assert LiteParser._is_module_importable("os") is True
        assert LiteParser._is_module_importable("non_existent_module") is False

    def test_valid_relative_import(self, tmp_path):
        # Create a directory structure
        package_dir = tmp_path / "project" / "subpackage"
        package_dir.mkdir(parents=True)

        # Create a valid module file
        module_file = package_dir / "module.py"
        module_file.touch()

        # Check if the relative import is resolvable
        file_path = package_dir / "another_module.py"
        file_path.touch()

        assert LiteParser._is_relative_import_resolvable(Path(file_path), "subpackage.module", 1) == True

    def test_valid_relative_import_with_dots(self, tmp_path):
        # Create a directory structure
        root_dir = tmp_path / "project"
        subpackage_dir = root_dir / "subpackage"
        subpackage_dir.mkdir(parents=True)
        
        # Create a valid module file
        module_file = root_dir / "module.py"
        module_file.touch()
        
        # Check if the relative import is resolvable (one level up)
        file_path = subpackage_dir / "another_module.py"
        file_path.touch()
        
        assert LiteParser._is_relative_import_resolvable(file_path, "module", 2) == True

    def test_invalid_relative_import(self, tmp_path):
        # Create a directory structure
        package_dir = tmp_path / "project" / "subpackage"
        package_dir.mkdir(parents=True)
        
        # Create a file that will simulate an import from a non-existing module
        file_path = package_dir / "another_module.py"
        file_path.touch()
        
        assert LiteParser._is_relative_import_resolvable(file_path, "nonexistent.module", 1) == False

    def test_import_of_package(self, tmp_path):
        # Create a directory structure with a package
        package_dir = tmp_path / "project" / "subpackage"
        package_dir.mkdir(parents=True)
        
        # Create __init__.py to make it a package
        init_file = package_dir / "__init__.py"
        init_file.touch()
        
        # Check if the relative import is resolvable for a package
        file_path = tmp_path / "project" / "module.py"
        file_path.touch()
        
        assert LiteParser._is_relative_import_resolvable(file_path, "subpackage", 1) == True

    def test_invalid_path_navigation(self, tmp_path):
        # Create a directory structure
        subpackage_dir = tmp_path / "project" / "subpackage"
        subpackage_dir.mkdir(parents=True)
        
        # Create a file
        file_path = subpackage_dir / "module.py"
        file_path.touch()
        
        # Trying to go up too many levels should fail
        assert LiteParser._is_relative_import_resolvable(file_path, "module", 5) == False

    @pytest.mark.parametrize(
        "statement,expected",
        [
            ("import os", True),
            ("from os import path", True),
            ("", False),
            ("import", False),
            (123, False),
        ],
    )
    def test_is_valid_import_stmt(self, statement, expected):
        assert LiteParser._is_valid_import_stmt(statement) == expected

    @pytest.mark.parametrize(
        "is_module_importable, is_relative_import_resolvable, import_statements, expected_unresolvable",
        [
            (
                True,
                True,
                [
                    "import os",
                    "from sys import path",
                    "import non_existent_module",
                    "from non_existent_module import path",
                    "from ...pipelines.nodes import test_func"
                ],
                [],
            ),
            (
                False,
                False,
                [
                    "import os",
                    "from sys import path",
                    "import non_existent_module",
                    "from non_existent_module import path",
                    "from ...pipelines.nodes import test_func"
                ],
                [
                    "import os",
                    "from sys import path",
                    "import non_existent_module",
                    "from non_existent_module import path",
                    "from ...pipelines.nodes import test_func"
                ],
            ),
            (True, False, ["import os", "import non_existent_module"], []),
        ],
    )
    def test_get_unresolvable_imports(
        self,
        is_module_importable,
        is_relative_import_resolvable,
        import_statements,
        expected_unresolvable,
        mocker,
    ):
        mocker.patch(
            "kedro_viz.integrations.kedro.lite_parser.LiteParser._is_module_importable",
            return_value=is_module_importable,
        )
        mocker.patch(
            "kedro_viz.integrations.kedro.lite_parser.LiteParser._is_relative_import_resolvable",
            return_value=is_relative_import_resolvable,
        )
        file_path = Path("/fake/path")
        lite_parser_obj = LiteParser(file_path)
        assert (
            lite_parser_obj._get_unresolvable_imports(file_path, import_statements)
            == expected_unresolvable
        )

    def test_parse_project_for_imports(self, tmp_path):
        file1 = tmp_path / "file1.py"
        file2 = tmp_path / "file2.py"
        file1.write_text("import os\nfrom sys import path")
        file2.write_text("import ast\nfrom collections import namedtuple")
        expected_imports = {
            file1: ["import os", "from sys import path"],
            file2: ["import ast", "from collections import namedtuple"],
        }
        lite_parser_obj = LiteParser(tmp_path)
        assert lite_parser_obj._parse_project_for_imports() == expected_imports

    def test_create_mock_imports(self):
        unresolvable_imports = [
            "import non_existent_module",
            "from non_existent_module import path",
        ]
        mock_modules = {}
        LiteParser._create_mock_imports(unresolvable_imports, mock_modules)
        assert "non_existent_module" in mock_modules
        assert isinstance(mock_modules["non_existent_module"], MagicMock)

    def test_get_mocked_modules(self, tmp_path, mocker):
        file1 = tmp_path / "file1.py"
        mocker.patch(
            "kedro_viz.integrations.kedro.lite_parser.LiteParser._parse_project_for_imports",
            return_value={file1: ["import os", "from sys import path"]},
        )
        mocker.patch(
            "kedro_viz.integrations.kedro.lite_parser.LiteParser._get_unresolvable_imports",
            return_value=["from sys import path"],
        )

        lite_parser_obj = LiteParser(tmp_path)
        mocked_modules = lite_parser_obj.get_mocked_modules()

        assert "sys" in mocked_modules
        assert isinstance(mocked_modules["sys"], MagicMock)
