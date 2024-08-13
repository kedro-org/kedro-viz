# """`kedro_viz.integrations.kedro.lite_parser` defines a Kedro parser using AST."""

# import ast
# import importlib.util
# import logging
# from pathlib import Path
# from typing import Any, Dict, List, Union
# from unittest.mock import MagicMock
# from kedro.framework.project import PACKAGE_NAME

# logger = logging.getLogger(__name__)
# PACKAGE_NAME = "demo_project"

# class LiteParser:
#     """Represents a Kedro Parser which uses AST

#     Args:
#         project_path (Path): the path where the Kedro project is located.
#     """

#     def __init__(self, project_path: Path) -> None:
#         self._project_path = project_path

#     @staticmethod
#     def _is_module_importable(module_name: str, package_name: str = None) -> bool:
#         """Checks if a module is importable

#         Args:
#             module_name (str): The name of the module to check
#                     importability
#         Returns:
#             Whether the module can be imported
#         """
#         try:
#             if importlib.util.find_spec(module_name, package_name) is None:
#                 return False
#             return True
#         except ModuleNotFoundError as exc:
#             print(exc)
#             return False
#         except (ImportError, ValueError):
#             return False

#     @staticmethod
#     def _is_relative_import_resolvable(
#         file_path: Path, module_name: str, dot_count: int
#     ) -> bool:
#         """Checks if a relative module is importable

#         Args:
#             file_path (Path): The file path where the module is mentioned
#                     as an import statement
#             module_name (str): The name of the module to check
#                     importability
#             dot_count (int): The length of dots in the module_name
#         Returns:
#             Whether the module can be imported
#         """

#         # import pdb
#         # pdb.set_trace()

#         # Get the current directory of the file
#         current_dir = file_path.parent

#         # Navigate up the directory tree based on the dot count
#         target_dir = current_dir
#         for _ in range(dot_count - 1):
#             if not target_dir:
#                 return False
#             target_dir = target_dir.parent

#         # Combine the target directory with module_name
#         if module_name:
#             module_parts = module_name.split(".")
#             module_path = target_dir.joinpath(*module_parts)
#         else:
#             module_path = target_dir

#         if module_path.is_dir():
#             # Check if it's a package by looking for __init__.py
#             init_file = module_path / "__init__.py"
#             return init_file.exists()
#         return module_path.with_suffix(".py").exists()

#     def _create_absolute_mock_imports(
#         self, module_name: str, mocked_modules: Dict[str, MagicMock]
#     ) -> None:
#         """Creates mock modules for the unresolvable imports and adds them to the
#         dictionary of mock_modules

#         Args:
#             module_name (str): The module name to be mocked
#             mocked_modules (Dict[str, MagicMock]): A dictionary of mocked imports

#         """

#         module_parts = module_name.split(".")
#         full_module_name = ""

#         for idx, sub_module_name in enumerate(module_parts):
#             full_module_name = (
#                 sub_module_name if idx == 0 else f"{full_module_name}.{sub_module_name}"
#             )
#             if (
#                 not self._is_module_importable(full_module_name)
#                 and full_module_name not in mocked_modules
#             ):
#                 mocked_modules[full_module_name] = MagicMock()

#     def get_mocked_modules(self) -> Dict[str, MagicMock]:
#         """Returns mocked modules for all the dependency errors
#         as a dictionary for each file in your Kedro project
#         """
#         mocked_modules: Dict[str, MagicMock] = {}

#         for filepath in self._project_path.rglob("*.py"):
#             with open(filepath, "r", encoding="utf-8") as file:
#                 file_content = file.read()

#             # parse file content using ast
#             parsed_content_ast_node: ast.Module = ast.parse(file_content)
#             self._mock_missing_dependencies(
#                 parsed_content_ast_node, filepath, mocked_modules
#             )

#         return mocked_modules

#     def _mock_missing_dependencies(
#         self,
#         parsed_content_ast_node: ast.Module,
#         file_path: Path,
#         mocked_modules: Dict[str, MagicMock],
#     ) -> None:
#         """Mock missing dependencies

#         Args:
#             parsed_content_ast_node (ast.Module): The AST node to
#                     extract import statements
#             file_path (Path): The current file path to check
#                     for missing dependencies
#             mocked_modules: A dictionary of mocked imports
#         """

#         for node in ast.walk(parsed_content_ast_node):
#             if isinstance(node, ast.Import):
#                 for alias in node.names:
#                     module_name = alias.name
#                     self._create_absolute_mock_imports(module_name, mocked_modules)

#             elif isinstance(node, ast.ImportFrom):
#                 module_name = node.module if node.module else ""
#                 level = node.level

#                 for alias in node.names:
#                     if level == 0:
#                         # absolute imports (should be from root_dir of the package)
#                         self._create_absolute_mock_imports(module_name, mocked_modules)
#                     else:
#                         # relative imports (starting with dot)
#                         # if not self._is_relative_import_resolvable(
#                         #     file_path, module_name, level
#                         # ):
#                         #     self._create_relative_mock_imports(
#                         #         file_path, module_name, level, mocked_modules
#                         #     )
#                         if not self._is_module_importable(module_name, PACKAGE_NAME):
#                             mocked_modules[module_name] = MagicMock()

#     def _create_relative_mock_imports(
#         self,
#         file_path: Path,
#         module_name: str,
#         level: int,
#         mocked_modules: Dict[str, MagicMock],
#     ):

#         # import pdb
#         # pdb.set_trace()

#         root = Path(self._project_path).resolve()
#         file = Path(file_path).resolve()

#         print("Root Path", root)
#         print("File Path", file)

#         # Extract the directory of the file
#         file_dir = file.parent

#         # Navigate up the directory tree based on the number of leading dots
#         target_dir = file_dir
#         for _ in range(level):
#             if target_dir == root:
#                 break
#             target_dir = target_dir.parent

#         # Create the absolute import path
#         module_path = ("." * (level) + module_name).replace('.', '/') + '.py'
#         absolute_path = target_dir / module_path
#         print(absolute_path.resolve())
#         mocked_modules[".nodes"] = MagicMock()

#     @staticmethod
#     def _extract_path_starting_from_package(file_path: Path) -> Union[Path, None]:
#         # Convert the file path to a list of parts
#         path_parts = file_path.parts

#         try:
#             package_index = path_parts.index(PACKAGE_NAME)
#         except ValueError:
#             return None

#         # Extract the path parts starting from the package name
#         sub_path = Path(*path_parts[package_index:])
        
#         return sub_path
    
#     @staticmethod
#     def _convert_relative_import_to_absolute(file_path: Path, relative_import: str, level: int) -> Union[Path, None]:
#         # Get the current directory of the file
#         current_dir = file_path.parent

#         # Navigate up the directory tree based on the dot count
#         target_dir = current_dir
#         for _ in range(level - 1):
#             if target_dir:
#                 target_dir = target_dir.parent

#         # Combine the target directory with module_name
#         if relative_import:
#             module_parts = relative_import.split(".")
#             module_path = target_dir.joinpath(*module_parts)
#         else:
#             module_path = target_dir

#         print(module_path)
#         module_absolute_path = LiteParser._extract_path_starting_from_package(module_path)
#         return module_absolute_path


# if __name__ == "__main__":
#     # print(LiteParser._extract_path_starting_from_package(Path("/Users/Ravi_Kumar_Pilla/Library/CloudStorage/OneDrive-McKinsey&Company/Documents/Kedro/KedroOrg/kedro-viz/demo-project/src/demo_project/pipelines/data_ingestion/pipeline.py")))
    
#     # print(importlib.util.find_spec())
#     print(LiteParser._convert_relative_import_to_absolute(Path("/Users/Ravi_Kumar_Pilla/Library/CloudStorage/OneDrive-McKinsey&Company/Documents/Kedro/KedroOrg/kedro-viz/demo-project/src/demo_project/pipelines/data_ingestion/pipeline.py"), "data_ingestion.nodes", 0))

