from collections import defaultdict
from pathlib import Path
import ast
from typing import Dict, List
from kedro.pipeline.modular_pipeline import pipeline as ModularPipeline
from kedro.pipeline.pipeline import Pipeline, Node


# WIP
class KedroPipelineLocator(ast.NodeVisitor):
    def __init__(self):
        self.pipeline = None

    def visit_FunctionDef(self, node):
        if node.name == "create_pipeline":
            kedro_node_extractor = KedroNodeExtractor()
            kedro_node_extractor.visit(node)
            self.pipeline = Pipeline(nodes=kedro_node_extractor.nodes)

            try:
                # modular pipeline
                if kedro_node_extractor.namespace:
                    print("Namespace is here", kedro_node_extractor.namespace)
                    self.pipeline = ModularPipeline(
                        self.pipeline,
                        inputs=kedro_node_extractor.inputs,
                        outputs=kedro_node_extractor.outputs,
                        parameters=set(),
                        tags=kedro_node_extractor.tags,
                        namespace=kedro_node_extractor.namespace,
                    )
            except Exception as exc:
                # [TODO: Error with modular pipeline]
                print("error")
                print(exc)
                self.pipeline = Pipeline(nodes=kedro_node_extractor.nodes)

        self.generic_visit(node)


class KedroNodeExtractor(ast.NodeVisitor):
    def __init__(self):
        self.nodes: List[Node] = []
        self.inputs = set()
        self.outputs = set()
        self.namespace = None
        self.parameters = set()
        self.tags = set()

    def visit_Call(self, node):
        if isinstance(node.func, ast.Name) and node.func.id == "pipeline":
            nodes = []
            inputs = set()
            outputs = set()
            namespace = None
            parameters = set()
            tags = set()
            for keyword in node.keywords:
                # print(keyword.arg)
                if keyword.arg == "namespace":
                    if isinstance(keyword.value, ast.Constant):
                        if not keyword.value.value:
                            continue
                        namespace = keyword.value.value
                elif keyword.arg == "inputs":
                    if isinstance(keyword.value, ast.Constant):
                        if not keyword.value.value:
                            continue
                        inputs = {keyword.value.value}
                    elif isinstance(keyword.value, ast.Set):
                        inputs = {elt.value for elt in keyword.value.elts}
                    elif isinstance(keyword.value, ast.Dict):
                        inputs = {elt.value for elt in keyword.value.keys}
                elif keyword.arg == "outputs":
                    if isinstance(keyword.value, ast.Constant):
                        if not keyword.value.value:
                            continue
                        outputs = {keyword.value.value}
                    if isinstance(keyword.value, ast.Set):
                        outputs = {elt.value for elt in keyword.value.elts}
                    elif isinstance(keyword.value, ast.Dict):
                        outputs = {elt.value for elt in keyword.value.keys}
                elif keyword.arg == "parameters":
                    if isinstance(keyword.value, ast.Constant):
                        if not keyword.value.value:
                            continue
                        parameters = {keyword.value.value}
                    if isinstance(keyword.value, ast.Set):
                        parameters = {elt.value for elt in keyword.value.elts}
                    elif isinstance(keyword.value, ast.Dict):
                        parameters = {elt.value for elt in keyword.value.keys}
                elif keyword.arg == "tags":
                    if isinstance(keyword.value, ast.Constant):
                        if not keyword.value.value:
                            continue
                        tags = {keyword.value.value}
                    if isinstance(keyword.value, ast.Set):
                        tags = {elt.value for elt in keyword.value.elts}
                    elif isinstance(keyword.value, ast.Dict):
                        tags = {elt.value for elt in keyword.value.keys}

            # exploring nodes
            for arg in node.args:
                if isinstance(arg, ast.List):
                    for elt in arg.elts:
                        if (
                            isinstance(elt, ast.Call)
                            and isinstance(elt.func, ast.Name)
                            and elt.func.id == "node"
                        ):
                            func = None
                            inputs = set()
                            outputs = set()
                            name = None
                            tags = set()
                            namespace = None
                            for keyword in elt.keywords:
                                if keyword.arg == "func":
                                    func = (
                                        keyword.value.id
                                        if isinstance(keyword.value, ast.Name)
                                        else "<lambda>"
                                    )
                                elif keyword.arg == "inputs":
                                    if isinstance(keyword.value, ast.Constant):
                                        if not keyword.value.value:
                                            continue
                                        inputs = {keyword.value.value}
                                    elif isinstance(keyword.value, ast.List):
                                        inputs = {
                                            elt.value for elt in keyword.value.elts
                                        }
                                    elif isinstance(keyword.value, ast.Dict):
                                        inputs = {
                                            elt.value for elt in keyword.value.keys
                                        }
                                elif keyword.arg == "outputs":
                                    if isinstance(keyword.value, ast.Constant):
                                        if not keyword.value.value:
                                            continue
                                        outputs = {keyword.value.value}
                                    elif isinstance(keyword.value, ast.List):
                                        outputs = {
                                            elt.value for elt in keyword.value.elts
                                        }
                                    elif isinstance(keyword.value, ast.Dict):
                                        outputs = {
                                            elt.value for elt in keyword.value.keys
                                        }
                                elif keyword.arg == "name":
                                    name = keyword.value.value
                                elif keyword.arg == "tags":
                                    if isinstance(keyword.value, ast.Constant):
                                        if not keyword.value.value:
                                            continue
                                        tags = {keyword.value.value}
                                    elif isinstance(keyword.value, ast.List):
                                        tags = {elt.value for elt in keyword.value.elts}
                                    elif isinstance(keyword.value, ast.Dict):
                                        tags = {elt.value for elt in keyword.value.keys}
                                elif keyword.arg == "namespace":
                                    if isinstance(keyword.value, ast.Constant):
                                        if not keyword.value.value:
                                            continue
                                        namespace = keyword.value.value

                            # Create Node
                            # [TODO: think of func=lambda *args: sum(args)]
                            kedro_node = Node(
                                func=lambda *args: sum(args),
                                inputs=list(inputs),
                                outputs=list(outputs),
                                name=name,
                                tags=tags,
                                namespace=namespace,
                            )

                            nodes.append(kedro_node)

            self.nodes.extend(nodes)
            self.inputs |= inputs
            self.outputs |= outputs
            self.namespace = namespace
            self.parameters |= parameters
            self.tags |= tags

        self.generic_visit(node)


def parse_project(project_path: Path) -> Dict[str, Pipeline]:
    pipelines: Dict[str, Pipeline] = defaultdict(dict)
    for filepath in project_path.rglob("*.py"):
        with open(filepath, "r") as file:
            file_content = file.read()

        parsed_content_ast_node = ast.parse(file_content)
        pipeline_name = filepath.relative_to(project_path).parent.name

        # Locate pipelines (assumes only 1 create_pipeline per pipeline file)
        kedro_pipeline_locator = KedroPipelineLocator()
        kedro_pipeline_locator.visit(parsed_content_ast_node)
        located_pipeline = kedro_pipeline_locator.pipeline
        # print(located_pipeline)
        if located_pipeline:
            pipelines[pipeline_name] = located_pipeline

    # creating a default pipeline
    pipelines["__default__"] = sum(pipelines.values())
    # dealing with pipeline level namespace
    # pipelines["data_processing"] = pipeline(
    #     pipelines["data_engineering"], namespace="data_processing"
    # )
    print(pipelines)
    return pipelines
