"""`kedro_viz.integrations.kedro.lite_parser` defines a Kedro parser using AST."""

import ast
import importlib.util
import logging
import re
from pathlib import Path
from typing import Any, Dict, List
from unittest.mock import MagicMock

logger = logging.getLogger(__name__)


class LiteParser:
    """Represents a Kedro Parser which uses AST

    Args:
        project_path (Path): the path where the Kedro project is located.
    """

    def __init__(self, project_path: Path) -> None:
        self._project_path = project_path

    @staticmethod
    def _get_import_statements_from_ast(
        parsed_content_ast_node: ast.Module,
    ) -> List[str]:
        """Get all the import statements from an AST Node.

        Args:
            parsed_content_ast_node (ast.Module): The AST node to
                    extract import statements
        Returns:
            A list of import statements as strings
        """
        import_statements: List[str] = []

        for node in ast.walk(parsed_content_ast_node):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    import_statements.append(f"import {alias.name}")
            elif isinstance(node, ast.ImportFrom):
                module_name = node.module if node.module else ""
                level = node.level
                for alias in node.names:
                    relative_module_name = "." * level + module_name
                    import_statements.append(
                        f"from {relative_module_name} import {alias.name}"
                    )

        return import_statements

    @staticmethod
    def _is_module_importable(module_name: str) -> bool:
        """Checks if a module is importable

        Args:
            module_name (str): The name of the module to check
                    importability
        Returns:
            Whether the module can be imported
        """
        try:
            if importlib.util.find_spec(module_name) is None:
                return False
            return True
        except (ImportError, ModuleNotFoundError, ValueError):
            return False

    @staticmethod
    def _is_relative_import_resolvable(
        file_path: Path, module_name: str, dot_count: int
    ) -> bool:
        """Checks if a relative module is importable

        Args:
            file_path (Path): The file path where the module is mentioned
                    as an import statement
            module_name (str): The name of the module to check
                    importability
            dot_count (int): The length of dots in the module_name
        Returns:
            Whether the module can be imported
        """
        # Get the current directory of the file
        current_dir = file_path.parent

        # Navigate up the directory tree based on the dot count
        target_dir = current_dir
        for _ in range(dot_count - 1):
            if not target_dir:
                return False
            target_dir = target_dir.parent

        # Combine the target directory with module_name
        if module_name:
            module_parts = module_name.split(".")
            module_path = target_dir.joinpath(*module_parts)
        else:
            module_path = target_dir

        if module_path.is_dir():
            # Check if it's a package by looking for __init__.py
            init_file = module_path / "__init__.py"
            return init_file.exists()
        return module_path.with_suffix(".py").exists()

    @staticmethod
    def _is_valid_import_stmt(statement: Any) -> bool:
        """Checks for a valid import statement

        Args:
            statement (Any): The import statement to validate

        Returns:
            Whether the statement is a valid import string
        """
        if not isinstance(statement, str) or not statement.strip():
            return False

        # Regex to match different import statements
        import_match = re.match(r"(from|import)\s+(\.+)?([a-zA-Z0-9_.]+)", statement)

        if not import_match:
            return False

        return True

    @staticmethod
    def _create_mock_imports(
        unresolvable_imports: List[str], mock_modules: Dict[str, MagicMock]
    ) -> None:
        """Creates mock modules for the unresolvable imports and adds them to the
        dictionary of mock_modules

        Args:
            unresolvable_imports (List[str]): A list of import statements
                    that are not resolved
            mock_modules (Dict[str, MagicMock]): A dictionary of mocked imports

        """
        for statement in unresolvable_imports:
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

    def _get_unresolvable_imports(
        self, file_path: Path, import_statements: List[str]
    ) -> List[str]:
        """Retrieves all the unresolved import statements from a file

        Args:
            file_path (Path): The file path where the import statements are mentioned
            import_statements (List[str]): A list of all the import statements mentioned in
                    the file
        Returns:
            A list of import statements that are not resolved
        """
        unresolvable_imports: List[str] = []

        for statement in import_statements:
            if self._is_valid_import_stmt(statement):
                if statement.startswith("import "):
                    # standard library imports, only considering root module
                    module_name = statement.split(" ")[1].split(".")[0]

                    if not self._is_module_importable(module_name):
                        unresolvable_imports.append(statement)
                else:
                    # relative imports
                    module_name = statement.split(" ")[1]

                    # Get the dot count for relative imports
                    dot_count = len(module_name) - len(module_name.lstrip("."))

                    if dot_count > 0:
                        if not self._is_relative_import_resolvable(
                            file_path, module_name[dot_count:], dot_count
                        ):
                            unresolvable_imports.append(statement)
                        continue

                    # absolute imports, only considering root module
                    module_name = module_name.split(".")[0]

                    if not self._is_module_importable(module_name):
                        unresolvable_imports.append(statement)

        return unresolvable_imports

    def _parse_project_for_imports(self) -> Dict[Path, List[str]]:
        """Loops through all the python files, parses each file using
        AST and creates a map containing the file path and the extracted
        import statements

        Returns:
            A dictionary of file path and corresponding import statements
        """
        all_imports: Dict[Path, List[str]] = {}

        for filepath in self._project_path.rglob("*.py"):
            with open(filepath, "r", encoding="utf-8") as file:
                file_content = file.read()

            # parse file content using ast
            parsed_content_ast_node: ast.Module = ast.parse(file_content)
            import_statements = self._get_import_statements_from_ast(
                parsed_content_ast_node
            )
            all_imports[filepath] = import_statements
        return all_imports

    def get_mocked_modules(self) -> Dict[str, MagicMock]:
        """Returns mocked modules for all the dependency errors
        as a dictionary for each file in your Kedro project
        """
        all_imports: Dict[Path, List[str]] = self._parse_project_for_imports()
        mocked_modules: Dict[str, MagicMock] = {}

        for file_path, imports in all_imports.items():
            unresolvable_imports: List[str] = self._get_unresolvable_imports(
                file_path, imports
            )
            # Create mock imports
            self._create_mock_imports(unresolvable_imports, mocked_modules)

        return mocked_modules
