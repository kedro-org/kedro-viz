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

    def get_mocked_modules(self) -> Dict[str, MagicMock]:
        """Returns mocked modules for all the dependency errors
        as a dictionary for each file in your Kedro project
        """
        mocked_modules: Dict[str, MagicMock] = {}

        for filepath in self._project_path.rglob("*.py"):
            with open(filepath, "r", encoding="utf-8") as file:
                file_content = file.read()

            # parse file content using ast
            parsed_content_ast_node: ast.Module = ast.parse(file_content)
            self._mock_missing_dependencies(
                parsed_content_ast_node, filepath, mocked_modules
            )

        return mocked_modules

    def _mock_missing_dependencies(
        self,
        parsed_content_ast_node: ast.Module,
        file_path: Path,
        mocked_modules: Dict[str, MagicMock],
    ) -> None:
        """Mock missing dependencies

        Args:
            parsed_content_ast_node (ast.Module): The AST node to
                    extract import statements
            file_path (Path): The current file path to check
                    for missing dependencies
            mocked_modules: A dictionary of mocked imports
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
                    if self._is_module_importable(module_name):
                        continue

                    # find module within the current package
                    absolute_module_name = self._convert_relative_imports_to_absolute(
                        file_path, ("." * level + module_name)
                    )
                    self._create_absolute_mock_imports(
                        absolute_module_name, mocked_modules
                    )

    @staticmethod
    def _extract_path_starting_from_package(file_path: Path) -> Union[Path, None]:
        # Convert the file path to a list of parts
        path_parts = file_path.parts

        try:
            package_index = path_parts.index(PACKAGE_NAME)
        except ValueError:
            return None

        # Extract the path parts starting from the package name
        sub_path = Path(*path_parts[package_index:])

        return sub_path

    @staticmethod
    def _convert_relative_imports_to_absolute(
        file_path: Path, relative_import: str
    ) -> str:
        file_path = file_path.resolve()

        # Ensure the package name is in the file path
        if PACKAGE_NAME not in file_path.parts:
            raise ValueError(
                f"Package name '{PACKAGE_NAME}' not found in the file path '{file_path}'."
            )

        # Find the package root directory
        package_index = file_path.parts.index(PACKAGE_NAME)
        package_root = Path(*file_path.parts[: package_index + 1])

        # Determine the directory of the current file
        file_directory = file_path.parent

        # Count the dots in the relative import to determine how many levels to go up
        if relative_import.startswith("."):
            # Calculate levels to go up based on leading dots
            levels_up = relative_import.count(".") - 1
            target_module = relative_import.split(".")[levels_up + 1]
        else:
            levels_up = 0
            target_module = relative_import.split(".")[-1]

        # Traverse up the directory structure
        target_directory = file_directory
        for _ in range(levels_up):
            target_directory = target_directory.parent

        # Construct the full module path from the package root
        relative_parts = target_directory.relative_to(package_root).parts
        absolute_import = ".".join(
            [PACKAGE_NAME] + list(relative_parts) + [target_module]
        )

        return absolute_import
