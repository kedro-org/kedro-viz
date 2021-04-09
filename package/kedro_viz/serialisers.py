from collections import asdict
from typing import Dict, List
from kedro_viz.models import GraphNode, GraphEdge


class GraphNodeSerializer:
    @classmethod
    def as_dict(node: GraphNode) -> Dict:
        res = asdict(node)
        res["tags"] = list(res["tags"])
        return res


class GraphEdgeSerializer:
    @classmethod
    def as_dict(edge: GraphEdge) -> Dict:
        return asdict(edge)
