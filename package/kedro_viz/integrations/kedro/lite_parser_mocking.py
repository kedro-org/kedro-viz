import ast
import logging
from pathlib import Path
import importlib.util
from unittest.mock import MagicMock

logger = logging.getLogger(__name__)


def _get_import_statements_from_ast(parsed_content_ast_node):
    import_statements = []

    for node in ast.walk(parsed_content_ast_node):
        if isinstance(node, ast.Import):
            for alias in node.names:
                import_statements.append(f"import {alias.name}")
        elif isinstance(node, ast.ImportFrom):
            module = node.module if node.module else ""
            for alias in node.names:
                import_statements.append(f"from {module} import {alias.name}")

    return import_statements


def _is_module_importable(module_name):
    try:
        importlib.import_module(module_name)
        return True
    except ImportError:
        return False


def _is_relative_import_resolvable(module_name, file_path):
    base_dir = file_path.parent
    relative_path = (base_dir / module_name.replace(".", "/")).with_suffix(".py")
    return relative_path.exists()


def _get_unresolvable_imports(import_statements, file_path):
    unresolvable_imports = []

    for statement in import_statements:
        if statement.startswith("import "):
            module_name = statement.split(" ")[1].split(".")[0]
            if not _is_module_importable(module_name):
                unresolvable_imports.append(statement)
        elif statement.startswith("from "):
            parts = statement.split(" ")
            module_name = parts[1]

            if _is_relative_import_resolvable(module_name, file_path):
                continue

            module_name = module_name.split(".")[0]

            if not _is_module_importable(module_name):
                unresolvable_imports.append(statement)

    return unresolvable_imports


def _parse_project_for_imports(project_path: Path):
    all_imports = {}
    for filepath in project_path.rglob("*.py"):
        with open(filepath, "r") as file:
            file_content = file.read()

        # parse file content using ast
        parsed_content_ast_node = ast.parse(file_content)
        import_statements = _get_import_statements_from_ast(parsed_content_ast_node)
        all_imports[filepath] = import_statements
    return all_imports


def _create_mock_imports(unresolvable_imports, mock_modules):
    for statement in unresolvable_imports:
        if statement.startswith("import "):
            module_name = statement.split(" ")[1]
        elif statement.startswith("from "):
            module_name = statement.split(" ")[1]

        parts = module_name.split(".")
        full_name = ""
        for i, part in enumerate(parts):
            full_name = part if i == 0 else f"{full_name}.{part}"
            if full_name not in mock_modules:
                mock_modules[full_name] = MagicMock()
            if i < len(parts) - 1:
                parent_module = mock_modules[full_name]
                if not hasattr(parent_module, part):
                    setattr(parent_module, part, MagicMock())


def get_mocked_modules(project_path: Path):
    all_imports = _parse_project_for_imports(project_path)
    mock_modules = {}

    for file_path, imports in all_imports.items():
        unresolvable_imports = _get_unresolvable_imports(imports, file_path)

        print(f"File Path: {file_path}, Import Errors: {unresolvable_imports}")

        # Create mock imports
        _create_mock_imports(unresolvable_imports, mock_modules)

    print(f"Mocked modules: {mock_modules}")

    return mock_modules
