import { createSelector } from 'reselect';
import { getPipelineNodeIDs } from './pipeline';
import { getNodeDisabled, getEdgeDisabled } from './disabled';
import { getAllEdges } from './modular-pipelines';

/**
 * Create a new edge from the first and last edge in the path
 * @param {string} target Node ID for the new edge
 * @param {string} source Node ID for the new edge
 * @param {object} transitiveEdges Store of existing edges
 */
export const addNewEdge = (source, target, { ids, sources, targets }) => {
  const id = [source, target].join('|');
  if (!ids.includes(id)) {
    ids.push(id);
    sources[id] = source;
    targets[id] = target;
  }
};

/**
 * Create new edges to connect nodes which have a disabled node (or nodes)
 * in between them
 */
export const getTransitiveEdges = createSelector(
  [getPipelineNodeIDs, getAllEdges, getNodeDisabled],
  (nodeIDs, edges, nodeDisabled) => {
    const transitiveEdges = {
      ids: [],
      sources: {},
      targets: {},
    };

    /**
     * Recursively walk through the graph, stepping over disabled nodes,
     * generating a list of nodes visited so far, and create transitive edges
     * for each path that visits disabled nodes between enabled nodes.
     * @param {Array} path The route that has been explored so far
     */
    const walkGraphEdges = (path) => {
      edges.ids.forEach((edgeID) => {
        const source = path[path.length - 1];
        // Filter to only edges where the source node is the previous target
        if (edges.sources[edgeID] !== source) {
          return;
        }
        const target = edges.targets[edgeID];
        if (nodeDisabled[target]) {
          // If target node is disabled then keep walking the graph
          walkGraphEdges(path.concat(target));
        } else if (path.length > 1) {
          // Else only create a new edge if there would be 3 or more nodes in the path
          addNewEdge(path[0], target, transitiveEdges);
        }
      });
    };

    // Only run walk if some nodes are disabled
    if (nodeIDs.some((nodeID) => nodeDisabled[nodeID])) {
      // Examine the children of every enabled node. The walk only needs
      // to be run in a single direction (i.e. top down), because links
      // that end in a terminus can never be transitive.
      nodeIDs.forEach((nodeID) => {
        if (!nodeDisabled[nodeID]) {
          walkGraphEdges([nodeID]);
        }
      });
    }

    return transitiveEdges;
  }
);

/**
 * Get only the visible edges (plus transitive edges),
 * and return them formatted as an array of objects
 */
export const getVisibleEdges = createSelector(
  [getAllEdges, getEdgeDisabled, getTransitiveEdges],
  (edges, edgeDisabled, transitiveEdges) =>
    edges.ids
      .filter((id) => !edgeDisabled[id])
      .concat(transitiveEdges.ids)
      .map((id) => ({
        id,
        source: edges.sources[id] || transitiveEdges.sources[id],
        target: edges.targets[id] || transitiveEdges.targets[id],
      }))
);
