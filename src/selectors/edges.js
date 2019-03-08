import { createSelector } from 'reselect';
import { arrayToObject } from '../utils';
import { getNodeDisabled } from './nodes';

const getView = state => state.view;
const getActiveSnapshot = state => state.activeSnapshot;
const getNodeType = state => state.nodeType;
const getSnapshotEdges = state => state.snapshotEdges;
const getEdgeSources = state => state.edgeSources;
const getEdgeTargets = state => state.edgeTargets;

/**
 * Get a list of edges for the active snapshot
 */
export const getActiveSnapshotEdges = createSelector(
  [getActiveSnapshot, getSnapshotEdges],
  (activeSnapshot, snapshotEdges) => snapshotEdges[activeSnapshot]
);

/**
 * Calculate whether edges should be disabled based on their source/target nodes
 */
export const getEdgeDisabledNode = createSelector(
  [
    getActiveSnapshotEdges,
    getNodeDisabled,
    getEdgeSources,
    getEdgeTargets,
  ],
  (
    activeSnapshotEdges,
    nodeDisabled,
    edgeSources,
    edgeTargets,
  ) => arrayToObject(activeSnapshotEdges, (edgeID) => {
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
    getEdgeTargets,
  ],
  (
    activeSnapshotEdges,
    nodeType,
    view,
    edgeSources,
    edgeTargets,
  ) => arrayToObject(activeSnapshotEdges, (edgeID) => {
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
  [
    getActiveSnapshotEdges,
    getEdgeDisabledNode,
    getEdgeDisabledView,
  ],
  (
    activeSnapshotEdges,
    edgeDisabledNode,
    edgeDisabledView,
  ) => arrayToObject(activeSnapshotEdges, (edgeID) => Boolean(
    edgeDisabledNode[edgeID] || edgeDisabledView[edgeID]
  ))
);

/**
 * Format edges and return them as an array
 */
export const getEdges = createSelector(
  [
    getActiveSnapshotEdges,
    getEdgeDisabled,
    getEdgeSources,
    getEdgeTargets,
  ],
  (
    activeSnapshotEdges,
    edgeDisabled,
    edgeSources,
    edgeTargets,
  ) => activeSnapshotEdges.map(edgeID => ({
    disabled: edgeDisabled[edgeID],
    source: edgeSources[edgeID],
    target: edgeTargets[edgeID],
  }))
);