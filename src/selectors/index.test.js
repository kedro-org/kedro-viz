import { mockState } from '../utils/state.mock';
import { getActiveSnapshotNodes, getActiveSnapshotEdges } from './index';

describe('Selectors', () => {
  describe('getActiveSnapshotNodes', () => {
    it('retrieves a list of nodes for the active snapshot', () => {
      expect(getActiveSnapshotNodes(mockState.lorem)).toEqual(
        expect.arrayContaining([expect.any(String)])
      );
    });

    it('returns an empty array if snapshotNodes is empty', () => {
      const newMockState = Object.assign({}, mockState.lorem, {
        snapshotNodes: {}
      });
      expect(getActiveSnapshotNodes(newMockState)).toEqual([]);
    });

    it('returns an empty array if activeSnapshot is undefined', () => {
      const newMockState = Object.assign({}, mockState.lorem, {
        activeSnapshot: undefined
      });
      expect(getActiveSnapshotNodes(newMockState)).toEqual([]);
    });
  });

  describe('getActiveSnapshotEdges', () => {
    it('gets a list of edges for the active snapshot', () => {
      expect(getActiveSnapshotEdges(mockState.lorem)).toEqual(
        expect.arrayContaining([expect.any(String)])
      );
    });

    it('returns an empty array if snapshotEdges is empty', () => {
      const newMockState = Object.assign({}, mockState.lorem, {
        snapshotEdges: {}
      });
      expect(getActiveSnapshotEdges(newMockState)).toEqual([]);
    });

    it('returns an empty array if activeSnapshot is undefined', () => {
      const newMockState = Object.assign({}, mockState.lorem, {
        activeSnapshot: undefined
      });
      expect(getActiveSnapshotEdges(newMockState)).toEqual([]);
    });
  });
});
