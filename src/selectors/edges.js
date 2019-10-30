import { createSelector } from 'reselect';
import { arrayToObject } from '../utils';
import { getNodeDisabled } from './nodes';

const getNodes = state => state.nodes;
const getEdges = state => state.edges;
const getEdgeSources = state => state.edgeSources;
const getEdgeTargets = state => state.edgeTargets;

/**
 * Calculate whether edges should be disabled based on their source/target nodes
 */
export const getEdgeDisabledNode = createSelector(
  [getEdges, getNodeDisabled, getEdgeSources, getEdgeTargets],
  (edges, nodeDisabled, edgeSources, edgeTargets) =>
    arrayToObject(edges, edgeID => {
      const source = edgeSources[edgeID];
      const target = edgeTargets[edgeID];
      return nodeDisabled[source] || nodeDisabled[target];
    })
);

/**
 * Determine whether an edge should be disabled
 */
export const getEdgeDisabled = createSelector(
  [getEdges, getEdgeDisabledNode],
  (edges, edgeDisabledNode) =>
    arrayToObject(edges, edgeID => Boolean(edgeDisabledNode[edgeID]))
);

/**
 * Create a new transitive edge from the first and last edge in the path
 * @param {string} target Node ID for the new edge
 * @param {string} source Node ID for the new edge
 * @param {object} transitiveEdges Store of existing edges
 */
export const addNewEdge = (source, target, { edgeIDs, sources, targets }) => {
  const id = [source, target].join('|');
  if (!edgeIDs.includes(id)) {
    edgeIDs.push(id);
    sources[id] = source;
    targets[id] = target;
  }
};

/**
 * Recursively walk through the graph, stepping over disabled nodes,
 * generating a list of nodes visited so far, and create transitive edges
 * for each path that visits disabled nodes between enabled nodes.
 * @param {Array} path The route that has been explored so far
 */
export const findTransitiveEdges = (
  edges,
  transitiveEdges,
  { edgeSources, edgeTargets, nodeDisabled }
) => {
  /**
   * Recursively walk through the graph, stepping over disabled nodes,
   * generating a list of nodes visited so far, and create transitive edges
   * for each path that visits disabled nodes between enabled nodes.
   * @param {Array} path The route that has been explored so far
   */
  const edgeGraphWalker = path => {
    edges.forEach(edgeID => {
      const source = path[path.length - 1];
      // Filter to only edges where the source node is the previous target
      if (edgeSources[edgeID] !== source) {
        return;
      }
      const target = edgeTargets[edgeID];
      if (nodeDisabled[target]) {
        // If target node is disabled then keep walking the graph
        edgeGraphWalker(path.concat(target));
      } else if (path.length > 1) {
        // Else only create a new edge if there would be 3 or more nodes in the path
        addNewEdge(path[0], target, transitiveEdges);
      }
    });
  };

  return edgeGraphWalker;
};

/**
 * Create new edges to connect nodes which have a disabled node (or nodes)
 * in between them
 */
export const getTransitiveEdges = createSelector(
  [getNodes, getEdges, getNodeDisabled, getEdgeSources, getEdgeTargets],
  (nodes, edges, nodeDisabled, edgeSources, edgeTargets) => {
    const transitiveEdges = {
      edgeIDs: [],
      sources: {},
      targets: {}
    };
    // Examine the children of every enabled node. The walk only needs
    // to be run in a single direction (i.e. top down), because links
    // that end in a terminus can never be transitive.
    nodes.forEach(nodeID => {
      if (!nodeDisabled[nodeID]) {
        findTransitiveEdges(edges, transitiveEdges, {
          edgeSources,
          edgeTargets,
          nodeDisabled
        })([nodeID]);
      }
    });
    return transitiveEdges;
  }
);

/**
 * Get only the visible edges (plus transitive edges),
 * and return them formatted as an array of objects
 */
export const getVisibleEdges = createSelector(
  [
    getEdges,
    getEdgeDisabled,
    getEdgeSources,
    getEdgeTargets,
    getTransitiveEdges
  ],
  (edges, edgeDisabled, edgeSources, edgeTargets, transitiveEdges) =>
    edges
      .filter(id => !edgeDisabled[id])
      .concat(transitiveEdges.edgeIDs)
      .map(id => ({
        id,
        source: edgeSources[id] || transitiveEdges.sources[id],
        target: edgeTargets[id] || transitiveEdges.targets[id]
      }))
);
