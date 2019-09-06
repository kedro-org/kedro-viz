import { createSelector } from 'reselect';

const getActiveSnapshot = state => state.activeSnapshot;
const getSnapshotNodes = state => state.snapshotNodes;
const getSnapshotEdges = state => state.snapshotEdges;

/**
 * Get a list of nodes for the active snapshot
 */
export const getActiveSnapshotNodes = createSelector(
  [getActiveSnapshot, getSnapshotNodes],
  (activeSnapshot, snapshotNodes) => snapshotNodes[activeSnapshot] || []
);

/**
 * Get a list of edges for the active snapshot
 */
export const getActiveSnapshotEdges = createSelector(
  [getActiveSnapshot, getSnapshotEdges],
  (activeSnapshot, snapshotEdges) => snapshotEdges[activeSnapshot] || []
);
