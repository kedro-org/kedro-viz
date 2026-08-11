"""Build modular pipeline groups, tree, and boundary connections for Viz.

Public entry points:

* ``ModularPipelineIndex``: which modular pipelines each dataset belongs to, built once.
* ``ModularPipelineView``: per-pipeline tree, group nodes and edges, built per render.

Concepts:

* Namespace: a dotted node path whose prefixes form nested modular-pipeline groups.
* Boundary I/O: datasets that enter or leave a namespace subtree.
* Tree: the group hierarchy and its task, dataset and nested-group children.
* Boundary edges: links between group nodes and their input and output datasets.

Modules, innermost first:

* ``boundaries``: free inputs and outputs per namespace, from Kedro's set algebra.
* ``index``: which modular pipelines a dataset belongs to, across the project.
* ``tree``: the folder hierarchy and its API representation.
* ``view``: group nodes and boundary edges for one rendered pipeline.
"""

from .index import ModularPipelineIndex
from .view import ModularPipelineView

__all__ = ["ModularPipelineIndex", "ModularPipelineView"]
