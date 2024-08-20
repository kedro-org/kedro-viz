"""`kedro_viz.integrations.kedro.lite_parser` defines a Kedro parser using AST."""

import ast
import importlib.util
import logging
from pathlib import Path
from typing import Dict, Union
from unittest.mock import MagicMock

logger = logging.getLogger(__name__)


class LiteParser:
    """Represents a Kedro Parser which uses AST

    Args:
        project_path (Path): the path where the Kedro project is located.
        package_name (Union[str, None]): The name of the current package
    """

    def __init__(
        self, project_path: Path, package_name: Union[str, None] = None
    ) -> None:
        self._project_path = project_path
        self._package_name = package_name
        self._project_file_paths = set(self._project_path.rglob("*.py"))

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
            # Check if the module can be importable
            # In case of submodule (contains a dot, e.g: sklearn.linear_model),
            # find_spec imports the parent module
            if importlib.util.find_spec(module_name) is None:
                return False
            return True
        except ModuleNotFoundError as mnf_exc:
            logger.debug(
                "ModuleNotFoundError in resolving %s : %s", module_name, mnf_exc
            )
            return False
        except ImportError as imp_exc:
            logger.debug("ImportError in resolving %s : %s", module_name, imp_exc)
            return False
        except ValueError as val_exc:
            logger.debug("ValueError in resolving %s : %s", module_name, val_exc)
            return False
        # pylint: disable=broad-except
        except Exception as exc:  # pragma: no cover
            logger.debug(
                "An exception occurred while resolving %s : %s", module_name, exc
            )
            return False

    def _is_relative_import(self, module_name: str):
        """Checks if a module is a relative import. This is needed
        in dev or standalone mode when the package_name is None and
        internal package files have unresolved external dependencies

        Args:
            module_name (str): The name of the module to check
                    importability

        Example:
            >>> lite_parser_obj = LiteParser("path/to/kedro/project")
            >>> module_name = "kedro_project_package.pipelines.reporting.nodes"
            >>> lite_parser_obj._is_relative_import(module_name)
            True

        Returns:
            Whether the module is a relative import starting
                    from the root package dir
        """
        relative_module_path = module_name.replace(".", "/")

        # Check if the relative_module_path
        # is a substring of current project file path
        is_relative_import_path = any(
            relative_module_path in str(project_file_path)
            for project_file_path in self._project_file_paths
        )

        return is_relative_import_path

    def _create_mock_imports(
        self, module_name: str, mocked_modules: Dict[str, MagicMock]
    ) -> None:
        """Creates mock modules for unresolvable imports and adds them to the
        dictionary of mocked_modules

        Args:
            module_name (str): The module name to be mocked
            mocked_modules (Dict[str, MagicMock]): A dictionary of mocked imports

        """
        module_parts = module_name.split(".")
        full_module_name = ""

        # Try to import each sub-module starting from the root module
        # Example: module_name = sklearn.linear_model
        # We will try to find spec for sklearn, sklearn.linear_model
        for idx, sub_module_name in enumerate(module_parts):
            full_module_name = (
                sub_module_name if idx == 0 else f"{full_module_name}.{sub_module_name}"
            )
            if (
                not self._is_module_importable(full_module_name)
                and full_module_name not in mocked_modules
            ):
                mocked_modules[full_module_name] = MagicMock()

    def _populate_mocked_modules(
        self,
        parsed_content_ast_node: ast.Module,
        mocked_modules: Dict[str, MagicMock],
    ) -> None:
        """Populate mocked_modules with missing external dependencies

        Args:
            parsed_content_ast_node (ast.Module): The AST node to
                    extract import statements
            mocked_modules (Dict[str, MagicMock]): A dictionary of mocked imports
        """
        for node in ast.walk(parsed_content_ast_node):
            # Handling dependencies that starts with "import "
            # Example: import logging
            # Corresponding AST node will be:
            # Import(names=[alias(name='logging')])
            if isinstance(node, ast.Import):
                for alias in node.names:
                    module_name = alias.name
                    self._create_mock_imports(module_name, mocked_modules)

            # Handling dependencies that starts with "from "
            # Example: from typing import Dict, Union
            # Corresponding AST node will be:
            # ImportFrom(module='typing', names=[alias(name='Dict'),
            #            alias(name='Union')],
            #            level=0)
            elif isinstance(node, ast.ImportFrom):
                module_name = node.module if node.module else ""
                level = node.level

                # Ignore relative imports like "from . import a"
                if not module_name:
                    continue

                # Ignore relative imports within the package
                # Examples:
                # "from demo_project.pipelines.reporting import test",
                # "from ..nodes import func_test"
                if (self._package_name and self._package_name in module_name) or (
                    # dev or standalone mode
                    not self._package_name
                    and self._is_relative_import(module_name)
                ):
                    continue

                # absolute modules in the env
                # Examples:
                # from typing import Dict, Union
                # from sklearn.linear_model import LinearRegression
                if level == 0:
                    self._create_mock_imports(module_name, mocked_modules)

    def get_mocked_modules(self) -> Dict[str, MagicMock]:
        """Returns mocked modules for all the dependency errors
        as a dictionary for each file in your Kedro project
        """
        mocked_modules: Dict[str, MagicMock] = {}

        for file_path in self._project_file_paths:
            with open(file_path, "r", encoding="utf-8") as file:
                file_content = file.read()

            # parse file content using ast
            parsed_content_ast_node: ast.Module = ast.parse(file_content)
            file_path = file_path.resolve()

            # Ensure the package name is in the file path
            if self._package_name and self._package_name not in file_path.parts:
                # we are only mocking the dependencies
                # inside the package
                continue

            self._populate_mocked_modules(
                parsed_content_ast_node,
                mocked_modules,
            )

        return mocked_modules
