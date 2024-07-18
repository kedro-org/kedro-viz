"""`kedro_viz.integrations.kedro.lite_parser` defines a Kedro parser using AST."""

import ast
import importlib.util
import logging
from pathlib import Path
from typing import Any, Dict, List
from unittest.mock import MagicMock

logger = logging.getLogger(__name__)


class LiteParser:
    def __init__(self, project_path: Path) -> None:
        self.project_path = project_path

    def _get_import_statements_from_ast(
        self, parsed_content_ast_node: ast.Module
    ) -> List[str]:
        import_statements: List[str] = []

        for node in ast.walk(parsed_content_ast_node):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    import_statements.append(f"import {alias.name}")
            elif isinstance(node, ast.ImportFrom):
                module = node.module if node.module else ""
                for alias in node.names:
                    import_statements.append(f"from {module} import {alias.name}")

        return import_statements

    def _is_module_importable(self, module_name: str) -> bool:
        try:
            importlib.import_module(module_name)
            return True
        except ImportError:
            return False

    def _is_relative_import_resolvable(self, file_path: Path, module_name: str) -> bool:
        base_dir = file_path.parent
        relative_path = (base_dir / module_name.replace(".", "/")).with_suffix(".py")
        return relative_path.exists()

    def _is_valid_import_stmt(self, statement: Any) -> bool:
        if not isinstance(statement, str) or not statement.strip():
            return False

        # Split the statement by spaces
        parts = statement.split()

        # Ensure that the statement has at least two parts
        if len(parts) < 2:
            return False

        return True

    def _get_unresolvable_imports(
        self, file_path: Path, import_statements: List[str]
    ) -> List[str]:
        unresolvable_imports: List[str] = []

        for statement in import_statements:
            if self._is_valid_import_stmt(statement):
                if statement.startswith("import "):
                    module_name = statement.split(" ")[1].split(".")[0]

                    if not self._is_module_importable(module_name):
                        unresolvable_imports.append(statement)

                elif statement.startswith("from "):
                    parts = statement.split(" ")
                    module_name = parts[1]

                    if self._is_relative_import_resolvable(file_path, module_name):
                        continue

                    # only checking for parent module
                    module_name = module_name.split(".")[0]

                    if not self._is_module_importable(module_name):
                        unresolvable_imports.append(statement)

        return unresolvable_imports

    def _parse_project_for_imports(self, project_path: Path) -> Dict[Path, List[str]]:
        all_imports: Dict[Path, List[str]] = {}

        for filepath in project_path.rglob("*.py"):
            with open(filepath, "r") as file:
                file_content = file.read()

            # parse file content using ast
            parsed_content_ast_node: ast.Module = ast.parse(file_content)
            import_statements = self._get_import_statements_from_ast(
                parsed_content_ast_node
            )
            all_imports[filepath] = import_statements
        return all_imports

    def _create_mock_imports(
        self, unresolvable_imports: List[str], mock_modules: Dict[str, MagicMock]
    ) -> None:
        for statement in unresolvable_imports:
            # needs error handling
            module_name = statement.split(" ")[1]
            module_parts = module_name.split(".")
            full_module_name = ""
            for idx, sub_module_name in enumerate(module_parts):
                full_module_name = (
                    sub_module_name
                    if idx == 0
                    else f"{full_module_name}.{sub_module_name}"
                )
                if full_module_name not in mock_modules:
                    mock_modules[full_module_name] = MagicMock()

    def get_mocked_modules(self) -> Dict[str, MagicMock]:
        all_imports: Dict[Path, List[str]] = self._parse_project_for_imports(
            self.project_path
        )
        mocked_modules: Dict[str, MagicMock] = {}

        for file_path, imports in all_imports.items():
            unresolvable_imports: List[str] = self._get_unresolvable_imports(
                file_path, imports
            )

            print(f"File Path: {file_path}, Unresolved imports: {unresolvable_imports}")

            # Create mock imports
            self._create_mock_imports(unresolvable_imports, mocked_modules)

        print(f"Mocked modules: {mocked_modules}")

        return mocked_modules
