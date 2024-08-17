"""`kedro_viz.integrations.kedro.lite_parser` defines a Kedro parser using AST."""

import ast
import importlib.util
import logging
from pathlib import Path
from typing import Any, Dict, List, Union
from unittest.mock import MagicMock
from kedro.framework.project import PACKAGE_NAME

logger = logging.getLogger(__name__)
PACKAGE_NAME = "demo_project"


class LiteParser:
    """Represents a Kedro Parser which uses AST

    Args:
        project_path (Path): the path where the Kedro project is located.
    """

    def __init__(self, project_path: Path) -> None:
        self._project_path = project_path.resolve()

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
        except (ModuleNotFoundError, ImportError, ValueError):
            return False

    @staticmethod
    def _convert_relative_imports_to_absolute(
        file_directory_path: Path,
        relative_import: str,
        level: int,
        package_root_path: Path,
    ) -> str:
        """This handles cases where there is a relative import in the file"""
        # Traverse up the directory structure
        target_directory = file_directory_path
        for _ in range(level - 1):
            target_directory = target_directory.parent

        # Construct the full module path from the package root
        relative_parts = target_directory.relative_to(package_root_path).parts
        absolute_import = ".".join(
            [PACKAGE_NAME] + list(relative_parts) + [relative_import]
        )

        return absolute_import

    def _create_absolute_mock_imports(
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
        file_directory_path: Path,
        package_root_path: Path,
        mocked_modules: Dict[str, MagicMock],
    ) -> None:
        """Mock missing dependencies

        Args:
            parsed_content_ast_node (ast.Module): The AST node to
                    extract import statements
            file_directory_path (Path): The current file path to check
                    for missing dependencies
            package_root_path (Path): The root package directory path
            mocked_modules (Dict[str, MagicMock]): A dictionary of mocked imports
        """
        for node in ast.walk(parsed_content_ast_node):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    module_name = alias.name
                    self._create_absolute_mock_imports(module_name, mocked_modules)

            elif isinstance(node, ast.ImportFrom):
                module_name = node.module if node.module else ""
                level = node.level

                if not module_name or module_name == "":
                    return

                for alias in node.names:
                    # absolute modules in the env or within the
                    # package starting from package root
                    if self._is_module_importable(module_name):
                        continue

                    # convert relative imports to absolute imports 
                    # based on leading dots
                    if level > 0:
                        absolute_module_name = (
                            self._convert_relative_imports_to_absolute(
                                file_directory_path,
                                module_name,
                                level,
                                package_root_path,
                            )
                        )
                        self._create_absolute_mock_imports(
                            absolute_module_name, mocked_modules
                        )
        
    def get_mocked_modules(self) -> Dict[str, MagicMock]:
        """Returns mocked modules for all the dependency errors
        as a dictionary for each file in your Kedro project
        """
        mocked_modules: Dict[str, MagicMock] = {}
        package_root_path = None

        for file_path in self._project_path.rglob("*.py"):
            with open(file_path, "r", encoding="utf-8") as file:
                file_content = file.read()

            # parse file content using ast
            parsed_content_ast_node: ast.Module = ast.parse(file_content)
            file_path = file_path.resolve()

            # Ensure the package name is in the file path
            if PACKAGE_NAME not in file_path.parts:
                # we are only mocking the dependencies
                # inside the package
                continue

            # Find the package root directory
            if not package_root_path:
                package_index = file_path.parts.index(PACKAGE_NAME)
                package_root_path = Path(*file_path.parts[: package_index + 1])

            # Determine the directory of the current file
            file_directory_path = file_path.parent

            self._mock_missing_dependencies(
                parsed_content_ast_node,
                file_directory_path,
                package_root_path,
                mocked_modules,
            )

        return mocked_modules
