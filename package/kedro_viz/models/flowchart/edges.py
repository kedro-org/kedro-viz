from pydantic import BaseModel


class GraphEdge(BaseModel, frozen=True):
    """Represent an edge in the graph

    Args:
        source (str): The id of the source node.
        target (str): The id of the target node.
    """

    source: str
    target: str
