"""`kedro_viz.integrations.kedro.lite_parser` defines a Kedro parser using AST."""

import ast
import importlib.util
import logging
from pathlib import Path
from typing import Dict, List, Set, Union
from unittest.mock import MagicMock

logger = logging.getLogger(__name__)


class LiteParser:
    """Represents a Kedro Parser which uses AST

    Args:
        package_name (Union[str, None]): The name of the current package
    """

    def __init__(self, package_name: Union[str, None] = None) -> None:
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

    @staticmethod
    def _get_module_parts(module_name: str) -> List[str]:
        """Creates a list of module parts to check for importability

        Args:
            module_name (str): The module name to split

        Returns:
            A list of module parts

        Example:
            >>> LiteParser._get_module_parts("kedro.framework.project")
            ["kedro", "kedro.framework", "kedro.framework.project"]

        """
        module_split = module_name.split(".")
        full_module_name = ""
        module_parts = []

        for idx, sub_module_name in enumerate(module_split):
            full_module_name = (
                sub_module_name if idx == 0 else f"{full_module_name}.{sub_module_name}"
            )
            module_parts.append(full_module_name)

        return module_parts

    def _is_relative_import(self, module_name: str, project_file_paths: Set[Path]):
        """Checks if a module is a relative import. This is needed
        in dev or standalone mode when the package_name is None and
        internal package files have unresolved external dependencies

        Args:
            module_name (str): The name of the module to check
                    importability
            project_file_paths (Set[Path]): A set of project file paths

        Returns:
            Whether the module is a relative import starting
                    from the root package dir

        Example:
            >>> lite_parser_obj = LiteParser()
            >>> module_name = "kedro_project_package.pipelines.reporting.nodes"
            >>> project_file_paths = set([Path("/path/to/relative/file")])
            >>> lite_parser_obj._is_relative_import(module_name, project_file_paths)
            True
        """
        relative_module_path = module_name.replace(".", "/")

        # Check if the relative_module_path
        # is a substring of current project file path
        is_relative_import_path = any(
            relative_module_path in str(project_file_path)
            for project_file_path in project_file_paths
        )

        return is_relative_import_path

    def _populate_missing_dependencies(
        self, module_name: str, missing_dependencies: Set[str]
    ) -> None:
        """Helper to populate missing dependencies

        Args:
            module_name (str): The module name to check if it is importable
            missing_dependencies (Set[str]): A set of missing dependencies

        """
        module_name_parts = self._get_module_parts(module_name)
        for module_name_part in module_name_parts:
            if (
                not self._is_module_importable(module_name_part)
                and module_name_part not in missing_dependencies
            ):
                missing_dependencies.add(module_name_part)

    def _get_unresolved_imports(
        self, file_path: Path, project_file_paths: Union[Set[Path], None] = None
    ) -> Set[str]:
        """Parse the file using AST and return any missing dependencies
        in the current file

        Args:
            file_path (Path): The file path to parse
            project_file_paths Union[Set[Path], None]: A set of project file paths

        Returns:
            A set of missing dependencies
        """

        missing_dependencies: Set[str] = set()

        # Read the file
        with open(file_path, "r", encoding="utf-8") as file:
            file_content = file.read()

        # parse file content using ast
        parsed_content_ast_node: ast.Module = ast.parse(file_content)
        file_path = file_path.resolve()

        # Explore each node in the AST tree
        for node in ast.walk(parsed_content_ast_node):
            # Handling dependencies that starts with "import "
            # Example: import logging
            # Corresponding AST node will be:
            # Import(names=[alias(name='logging')])
            if isinstance(node, ast.Import):
                for alias in node.names:
                    module_name = alias.name
                    self._populate_missing_dependencies(
                        module_name, missing_dependencies
                    )

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
                    and project_file_paths
                    and self._is_relative_import(module_name, project_file_paths)
                ):
                    continue

                # absolute modules in the env
                # Examples:
                # from typing import Dict, Union
                # from sklearn.linear_model import LinearRegression
                if level == 0:
                    self._populate_missing_dependencies(
                        module_name, missing_dependencies
                    )

        return missing_dependencies

    def create_mock_modules(self, unresolved_imports: Set[str]) -> Dict[str, MagicMock]:
        """Creates mock modules for unresolved imports

        Args:
            unresolved_imports (Set[str]): A set of unresolved imports

        Returns:
            A dictionary of mocked modules for the unresolved imports
        """
        mocked_modules: Dict[str, MagicMock] = {}

        for unresolved_import in unresolved_imports:
            mocked_modules[unresolved_import] = MagicMock()

        return mocked_modules

    def parse(self, target_path: Path) -> Union[Dict[str, Set[str]], None]:
        """Parses the file(s) in the target path and returns
        any unresolved imports for all the dependency errors
        as a dictionary of file(s) in the target path and a set of module names

        Args:
            target_path (Path): The path to parse file(s)

        Returns:
            A dictionary of file(s) in the target path and a set of module names
        """

        if not target_path.exists():
            logger.warning("Path `%s` does not exist", str(target_path))
            return None

        unresolved_imports: Dict[str, Set[str]] = {}

        if target_path.is_file():
            missing_dependencies = self._get_unresolved_imports(target_path)
            if len(missing_dependencies) > 0:
                unresolved_imports[str(target_path)] = missing_dependencies
            return unresolved_imports

        # handling directories
        _project_file_paths = set(target_path.rglob("*.py"))

        for file_path in _project_file_paths:
            try:
                # Ensure the package name is in the file path
                if self._package_name and self._package_name not in file_path.parts:
                    # we are only mocking the dependencies
                    # inside the package
                    continue

                missing_dependencies = self._get_unresolved_imports(
                    file_path, _project_file_paths
                )
                if len(missing_dependencies) > 0:
                    unresolved_imports[str(file_path)] = missing_dependencies
            # pylint: disable=broad-except
            except Exception as exc:  # pragma: no cover
                logger.error(
                    "An error occurred in LiteParser while mocking dependencies : %s",
                    exc,
                )
                continue

        return unresolved_imports
