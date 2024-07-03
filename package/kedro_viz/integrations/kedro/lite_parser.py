import ast
import logging
from collections import defaultdict
from pathlib import Path
from typing import Dict, Iterable, List

from kedro.pipeline.modular_pipeline import pipeline as ModularPipeline
from kedro.pipeline.pipeline import Node, Pipeline

logger = logging.getLogger(__name__)


class KedroPipelineLocator(ast.NodeVisitor):
    """
    Represents a pipeline that is located when parsing
    the Kedro project's `create_pipeline` function

    """

    def __init__(self):
        self.pipeline = None

    def visit_FunctionDef(self, node):
        try:
            if node.name == "create_pipeline":
                # Explore the located pipeline for nodes
                # and other keyword args
                kedro_pipeline_explorer = KedroPipelineExplorer()
                kedro_pipeline_explorer.visit(node)
                try:
                    # modular pipeline
                    if kedro_pipeline_explorer.namespace:
                        self.pipeline = ModularPipeline(
                            pipe=kedro_pipeline_explorer.nodes,
                            inputs=kedro_pipeline_explorer.inputs,
                            outputs=kedro_pipeline_explorer.outputs,
                            parameters=kedro_pipeline_explorer.parameters,
                            tags=kedro_pipeline_explorer.tags,
                            namespace=kedro_pipeline_explorer.namespace,
                        )
                    else:
                        # kedro pipeline
                        self.pipeline = Pipeline(
                            nodes=kedro_pipeline_explorer.nodes,
                            tags=kedro_pipeline_explorer.tags,
                        )
                except Exception as exc:
                    # [TODO: Error with modular pipeline, try creating regular pipeline]
                    logger.error(exc)
                    self.pipeline = Pipeline(
                        nodes=kedro_pipeline_explorer.nodes,
                        tags=kedro_pipeline_explorer.tags,
                    )

            self.generic_visit(node)

        except Exception as exc:
            # [TODO: Error with parsing the file,
            # dump the visiting node for debugging]
            logger.error(exc)
            logger.info(ast.dump(node, indent=2))


class KedroPipelineExplorer(ast.NodeVisitor):
    # [TODO: Current explorer only serves for 1 pipeline() function within a create_pipeline def]
    def __init__(self):
        # keeping these here for future use-case
        # when dealing with multiple `pipeline()` functions
        # within a create_pipeline def
        self.nodes: List[Node] = []
        self.inputs = None
        self.outputs = None
        self.namespace = None
        self.parameters = None
        self.tags = None

    def visit_Call(self, node):
        if isinstance(node.func, ast.Name) and node.func.id == "pipeline":
            # for a modular pipeline
            # [TODO: pipe to be explored later]
            # pipe: Iterable[Node | Pipeline] | Pipeline

            pipeline_inputs: str | set[str] | dict[str, str] | None = None
            pipeline_outputs: str | set[str] | dict[str, str] | None = None
            pipeline_namespace: str | None = None
            pipeline_parameters: str | set[str] | dict[str, str] | None = None
            pipeline_tags: str | Iterable[str] | None = None

            for keyword in node.keywords:
                if keyword.arg == "namespace":
                    pipeline_namespace = parse_value(keyword.value)
                elif keyword.arg == "inputs":
                    pipeline_inputs = parse_value(keyword.value)
                elif keyword.arg == "outputs":
                    pipeline_outputs = parse_value(keyword.value)
                elif keyword.arg == "parameters":
                    pipeline_parameters = parse_value(keyword.value)
                elif keyword.arg == "tags":
                    pipeline_tags = parse_value(keyword.value)

            # exploring nodes
            for arg in node.args:
                if isinstance(arg, ast.List):
                    for elt in arg.elts:
                        if (
                            isinstance(elt, ast.Call)
                            and isinstance(elt.func, ast.Name)
                            and elt.func.id == "node"
                        ):
                            node_func = None
                            node_inputs: str | list[str] | dict[str, str] | None = None
                            node_outputs: str | list[str] | dict[str, str] | None = None
                            node_name: str | None = None
                            node_tags: str | Iterable[str] | None = None
                            node_confirms: str | list[str] | None = None
                            node_namespace: str | None = None

                            for keyword in elt.keywords:
                                # [TODO: func is WIP. Need to create a Callable]
                                if keyword.arg == "func":
                                    if isinstance(keyword.value, ast.Name):
                                        func_name = keyword.value.id
                                        exec(
                                            f"def {func_name}(*args, **kwargs): pass",
                                            globals(),
                                        )
                                        node_func = globals()[func_name]
                                    else:
                                        node_func = lambda *args, **kwargs: None
                                elif keyword.arg == "inputs":
                                    node_inputs = parse_value(keyword.value)
                                elif keyword.arg == "outputs":
                                    node_outputs = parse_value(keyword.value)
                                elif keyword.arg == "name":
                                    node_name = parse_value(keyword.value)
                                elif keyword.arg == "tags":
                                    node_tags = parse_value(keyword.value)
                                elif keyword.arg == "confirms":
                                    node_confirms = parse_value(keyword.value)
                                elif keyword.arg == "namespace":
                                    node_namespace = parse_value(keyword.value)

                            # Create Node
                            kedro_node = Node(
                                func=node_func,
                                inputs=node_inputs,
                                outputs=node_outputs,
                                name=node_name,
                                tags=node_tags,
                                confirms=node_confirms,
                                namespace=node_namespace,
                            )

                            self.nodes.append(kedro_node)

            # These will be used for modular pipeline creation
            self.inputs = pipeline_inputs
            self.outputs = pipeline_outputs
            self.namespace = pipeline_namespace
            self.parameters = pipeline_parameters
            self.tags = pipeline_tags

        self.generic_visit(node)


# Helper functions
def parse_value(keyword_value):
    """Helper to parse values assigned to node/pipeline properties"""
    if isinstance(keyword_value, ast.Constant):
        if not keyword_value.value:
            return None
        return str(keyword_value.value)
    elif isinstance(keyword_value, (ast.List, ast.Set)):
        return [parse_value(elt) for elt in keyword_value.elts]
    elif isinstance(keyword_value, ast.Dict):
        return {
            parse_value(k): parse_value(v)
            for k, v in zip(keyword_value.keys, keyword_value.values)
        }
    elif isinstance(keyword_value, ast.ListComp):
        # [TODO: For list comprehensions, complex case handling]
        # [Example can be found under demo_project/pipelines/modelling]
        return f"ListComp({ast.dump(keyword_value)})"
    elif isinstance(keyword_value, ast.DictComp):
        # [TODO: For dict comprehensions, complex case handling]
        # [Example can be found under demo_project/pipelines/modelling]
        return f"DictComp({ast.dump(keyword_value)})"
    elif isinstance(keyword_value, ast.FormattedValue):
        # [TODO: For formatted strings i.e., single formatted fields,
        # complex case handling]
        # [Example can be found under demo_project/pipelines/modelling]
        return f"FormattedValue({ast.dump(keyword_value)})"
    elif isinstance(keyword_value, ast.JoinedStr):
        # [TODO: For joined strings i.e., multiple formatted fields,
        # complex case handling]
        # [Example can be found under demo_project/pipelines/modelling]
        return f"JoinedStr({ast.dump(keyword_value)})"
    elif isinstance(keyword_value, ast.Name):
        # [TODO: For variable references, complex case handling]
        # [Example can be found under demo_project/pipelines/modelling]
        return f"Variable({ast.dump(keyword_value)})"
    else:
        # [TODO: For any other complex case handling]
        return f"Unsupported({ast.dump(keyword_value)})"


# [WIP: Naive parsing and exploring pipelines. Not sure of any better way for now]
def parse_project(project_path: Path) -> Dict[str, Pipeline]:
    # Result
    pipelines: Dict[str, Pipeline] = defaultdict(dict)

    # Loop through all the .py files in the kedro project
    # and start locating create_pipeline
    for filepath in project_path.rglob("*.py"):
        with open(filepath, "r") as file:
            file_content = file.read()

        # parse file content using ast
        parsed_content_ast_node = ast.parse(file_content)

        # extract pipeline name from file path
        pipeline_name = filepath.relative_to(project_path).parent.name

        # Locate pipelines (tested for only 1 create_pipeline per pipeline file)
        # [TODO: confirm with Kedro team if more than 1 create_pipeline existence]
        kedro_pipeline_locator = KedroPipelineLocator()
        kedro_pipeline_locator.visit(parsed_content_ast_node)
        located_pipeline = kedro_pipeline_locator.pipeline

        # add to the result if a pipeline is located
        if located_pipeline:
            pipelines[pipeline_name] = located_pipeline

    # foolproof to have atleast 1 pipeline
    # so the UI won't break
    if len(pipelines.keys()):
        # creating a default pipeline
        pipelines["__default__"] = sum(pipelines.values())
    else:
        pipelines["__default__"] = Pipeline(nodes=[])

    return pipelines
