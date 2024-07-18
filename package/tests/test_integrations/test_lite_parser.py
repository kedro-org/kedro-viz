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

    def test_is_relative_import_resolvable(self, tmp_path):
        file_path = tmp_path / "test.py"
        file_path.touch()
        (tmp_path / "module.py").touch()
        assert LiteParser._is_relative_import_resolvable(file_path, "module") is True
        assert (
            LiteParser._is_relative_import_resolvable(file_path, "non_existent_module")
            is False
        )

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
        "is_module_importable, is_relative_import_resolvable, expected_unresolvable",
        [
            (True, True, []),
            (True, False, []),
            (False, True, ["import os", "import non_existent_module"]),
            (
                False,
                False,
                [
                    "import os",
                    "from sys import path",
                    "import non_existent_module",
                    "from non_existent_module import path",
                ],
            ),
        ],
    )
    def test_get_unresolvable_imports(
        self,
        is_module_importable,
        is_relative_import_resolvable,
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
        import_statements = [
            "import os",
            "from sys import path",
            "import non_existent_module",
            "from non_existent_module import path",
        ]
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
