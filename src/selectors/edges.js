import { createSelector } from 'reselect';
import { arrayToObject } from '../utils';
import { getActiveSnapshotNodes, getActiveSnapshotEdges } from './index';
import { getNodeDisabled } from './nodes';

const getView = state => state.view;
const getNodeType = state => state.nodeType;
const getEdgeSources = state => state.edgeSources;
const getEdgeTargets = state => state.edgeTargets;

/**
 * Calculate whether edges should be disabled based on their source/target nodes
 */
export const getEdgeDisabledNode = createSelector(
  [getActiveSnapshotEdges, getNodeDisabled, getEdgeSources, getEdgeTargets],
  (activeSnapshotEdges, nodeDisabled, edgeSources, edgeTargets) =>
    arrayToObject(activeSnapshotEdges, edgeID => {
      const source = edgeSources[edgeID];
      const target = edgeTargets[edgeID];
      return nodeDisabled[source] || nodeDisabled[target];
    })
);

/**
 * Calculate whether edges should be disabled based on the view
 */
export const getEdgeDisabledView = createSelector(
  [
    getActiveSnapshotEdges,
    getNodeType,
    getView,
    getEdgeSources,
    getEdgeTargets
  ],
  (activeSnapshotEdges, nodeType, view, edgeSources, edgeTargets) =>
    arrayToObject(activeSnapshotEdges, edgeID => {
      const source = edgeSources[edgeID];
      const sourceType = nodeType[source];
      const target = edgeTargets[edgeID];
      const targetType = nodeType[target];
      if (view === 'combined') {
        return sourceType === targetType;
      }
      return view !== sourceType || view !== targetType;
    })
);

/**
 * Determine whether an edge should be disabled
 */
export const getEdgeDisabled = createSelector(
  [getActiveSnapshotEdges, getEdgeDisabledNode, getEdgeDisabledView],
  (activeSnapshotEdges, edgeDisabledNode, edgeDisabledView) =>
    arrayToObject(activeSnapshotEdges, edgeID =>
      Boolean(edgeDisabledNode[edgeID] || edgeDisabledView[edgeID])
    )
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
  activeSnapshotEdges,
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
    activeSnapshotEdges.forEach(edgeID => {
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
  [
    getActiveSnapshotNodes,
    getActiveSnapshotEdges,
    getNodeDisabled,
    getEdgeSources,
    getEdgeTargets
  ],
  (
    activeSnapshotNodes,
    activeSnapshotEdges,
    nodeDisabled,
    edgeSources,
    edgeTargets
  ) => {
    const transitiveEdges = {
      edgeIDs: [],
      sources: {},
      targets: {}
    };
    // Examine the children of every enabled node. The walk only needs
    // to be run in a single direction (i.e. top down), because links
    // that end in a terminus can never be transitive.
    activeSnapshotNodes.forEach(nodeID => {
      if (!nodeDisabled[nodeID]) {
        findTransitiveEdges(activeSnapshotEdges, transitiveEdges, {
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
    getActiveSnapshotEdges,
    getEdgeDisabled,
    getEdgeSources,
    getEdgeTargets,
    getTransitiveEdges
  ],
  (
    activeSnapshotEdges,
    edgeDisabled,
    edgeSources,
    edgeTargets,
    transitiveEdges
  ) =>
    activeSnapshotEdges
      .filter(id => !edgeDisabled[id])
      .concat(transitiveEdges.edgeIDs)
      .map(id => ({
        id,
        source: edgeSources[id] || transitiveEdges.sources[id],
        target: edgeTargets[id] || transitiveEdges.targets[id]
      }))
);
