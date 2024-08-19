"""`kedro_viz.integrations.kedro.lite_parser` defines a Kedro parser using AST."""

import ast
import importlib.util
import logging
from pathlib import Path
from typing import Dict
from unittest.mock import MagicMock

logger = logging.getLogger(__name__)


class LiteParser:
    """Represents a Kedro Parser which uses AST

    Args:
        project_path (Path): the path where the Kedro project is located.
    """

    def __init__(self, project_path: Path, package_name: str) -> None:
        self._project_path = project_path
        self._package_name = package_name

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

    def _create_mock_imports(
        self, module_name: str, mocked_modules: Dict[str, MagicMock]
    ) -> None:
        """Creates mock modules for the unresolvable imports and adds them to the
        dictionary of mock_modules

        Args:
            module_name (str): The module name to be mocked
            mocked_modules (Dict[str, MagicMock]): A dictionary of mocked imports

        """

        module_parts = module_name.split(".")
        full_module_name = ""

        for idx, sub_module_name in enumerate(module_parts):
            full_module_name = (
                sub_module_name if idx == 0 else f"{full_module_name}.{sub_module_name}"
            )
            if (
                not self._is_module_importable(full_module_name)
                and full_module_name not in mocked_modules
            ):
                mocked_modules[full_module_name] = MagicMock()

    def _mock_missing_dependencies(
        self,
        parsed_content_ast_node: ast.Module,
        mocked_modules: Dict[str, MagicMock],
    ) -> None:
        """Mock missing project dependencies
        [TODO : Relative imports with dot, even if mocked had issues]
        Args:
            parsed_content_ast_node (ast.Module): The AST node to
                    extract import statements
            mocked_modules (Dict[str, MagicMock]): A dictionary of mocked imports
        """
        for node in ast.walk(parsed_content_ast_node):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    module_name = alias.name
                    self._create_mock_imports(module_name, mocked_modules)

            elif isinstance(node, ast.ImportFrom):
                module_name = node.module if node.module else ""
                level = node.level

                if (
                    not module_name
                    or module_name == ""
                    or self._package_name in module_name
                ):
                    return

                # absolute modules in the env
                if level == 0:
                    self._create_absolute_mock_imports(module_name, mocked_modules)

    def get_mocked_modules(self) -> Dict[str, MagicMock]:
        """Returns mocked modules for all the dependency errors
        as a dictionary for each file in your Kedro project
        """
        mocked_modules: Dict[str, MagicMock] = {}

        for file_path in self._project_path.rglob("*.py"):
            with open(file_path, "r", encoding="utf-8") as file:
                file_content = file.read()

            # parse file content using ast
            parsed_content_ast_node: ast.Module = ast.parse(file_content)
            file_path = file_path.resolve()

            # Ensure the package name is in the file path
            # [TODO: At this moment we are focussing on mocking missing
            # dependencies inside the package]
            if self._package_name not in file_path.parts:
                # we are only mocking the dependencies
                # inside the package
                continue

            self._mock_missing_dependencies(
                parsed_content_ast_node,
                mocked_modules,
            )

        return mocked_modules
