import { mockState } from '../utils/state.mock';
import {
  getSnapshotHistory,
  getActiveSnapshotMessage,
  getActiveSnapshotTimestamp,
  getActiveSchema,
  getActiveSnapshotNodes,
  getActiveSnapshotEdges
} from './index';

describe('Selectors', () => {
  describe('getSnapshotHistory', () => {
    it('retrieves a list of snapshots used in the History tab', () => {
      expect(getSnapshotHistory(mockState)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            message: expect.any(String),
            timestamp: expect.any(Number)
          })
        ])
      );
    });
  });

  describe('getActiveSnapshotMessage', () => {
    it('retrieves the message for the active snapshot', () => {
      expect(getActiveSnapshotMessage(mockState)).toEqual(expect.any(String));
    });
  });

  describe('getActiveSnapshotTimestamp', () => {
    it('retrieves the timestamp for the active snapshot', () => {
      expect(getActiveSnapshotTimestamp(mockState)).toEqual(expect.any(Number));
    });
  });

  describe('getActiveSchema', () => {
    it('retrieves the raw unformatted data schema for the active snapshot', () => {
      const schema = getActiveSchema(mockState);
      expect(schema).toEqual(expect.any(String));
      expect(JSON.parse(schema)).toEqual(expect.any(Object));
    });
  });

  describe('getActiveSnapshotNodes', () => {
    it('retrieves a list of nodes for the active snapshot', () => {
      expect(getActiveSnapshotNodes(mockState)).toEqual(
        expect.arrayContaining([expect.any(String)])
      );
    });

    it('returns an empty array if snapshotNodes is empty', () => {
      const newMockState = Object.assign({}, mockState, { snapshotNodes: {} });
      expect(getActiveSnapshotNodes(newMockState)).toEqual([]);
    });

    it('returns an empty array if activeSnapshot is undefined', () => {
      const newMockState = Object.assign({}, mockState, {
        activeSnapshot: undefined
      });
      expect(getActiveSnapshotNodes(newMockState)).toEqual([]);
    });
  });

  describe('getActiveSnapshotEdges', () => {
    it('gets a list of edges for the active snapshot', () => {
      expect(getActiveSnapshotEdges(mockState)).toEqual(
        expect.arrayContaining([expect.any(String)])
      );
    });

    it('returns an empty array if snapshotEdges is empty', () => {
      const newMockState = Object.assign({}, mockState, { snapshotEdges: {} });
      expect(getActiveSnapshotEdges(newMockState)).toEqual([]);
    });

    it('returns an empty array if activeSnapshot is undefined', () => {
      const newMockState = Object.assign({}, mockState, {
        activeSnapshot: undefined
      });
      expect(getActiveSnapshotEdges(newMockState)).toEqual([]);
    });
  });
});
