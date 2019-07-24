import { createSelector } from 'reselect';

const getActiveSnapshot = state => state.activeSnapshot;
const getSnapshotIDs = state => state.snapshotIDs;
const getSnapshotSchema = state => state.snapshotSchema;
const getSnapshotMessage = state => state.snapshotMessage;
const getSnapshotTimestamp = state => state.snapshotTimestamp;
const getSnapshotNodes = state => state.snapshotNodes;
const getSnapshotEdges = state => state.snapshotEdges;

/**
 * Retrieve list of snapshots used in History tab
 */
export const getSnapshotHistory = createSelector(
  [getSnapshotIDs, getSnapshotMessage, getSnapshotTimestamp],
  (snapshotIDs, snapshotMessages, snapshotTimestamps) =>
    snapshotIDs.map(id => {
      return {
        id,
        message: snapshotMessages[id],
        timestamp: snapshotTimestamps[id]
      };
    })
);

/**
 * Get the message for the active snapshot
 */
export const getActiveSnapshotMessage = createSelector(
  [getActiveSnapshot, getSnapshotMessage],
  (activeSnapshot, snapshotMessages) => snapshotMessages[activeSnapshot]
);

/**
 * Get the timestamp for the active snapshot
 */
export const getActiveSnapshotTimestamp = createSelector(
  [getActiveSnapshot, getSnapshotTimestamp],
  (activeSnapshot, snapshotTimestamps) => snapshotTimestamps[activeSnapshot]
);

/**
 * Return the raw unformatted data schema for the active snapshot
 */
export const getActiveSchema = createSelector(
  [getActiveSnapshot, getSnapshotSchema],
  (activeSnapshot, snapshotSchemas) =>
    JSON.stringify(snapshotSchemas[activeSnapshot])
);

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
