import { mockState } from '../utils/data.mock';
import {
  getActiveSnapshotEdges,
  getEdgeDisabledNode,
  getEdgeDisabledView,
  getEdgeDisabled,
  getEdges,
  getVisibleEdges
} from './edges';
import { getActiveSnapshotNodes } from './nodes';
import { changeView, toggleNodeDisabled } from '../actions';
import reducer from '../reducers';

describe('Selectors', () => {
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

  describe('getEdgeDisabledNode', () => {
    it('returns an object', () => {
      expect(getEdgeDisabledNode(mockState)).toEqual(expect.any(Object));
    });

    it("returns an object whose keys match the active snapshot's edges", () => {
      expect(Object.keys(getEdgeDisabledNode(mockState))).toEqual(
        getActiveSnapshotEdges(mockState)
      );
    });

    it('returns an object whose values are all Booleans', () => {
      expect(
        Object.values(getEdgeDisabledNode(mockState)).every(
          value => typeof value === 'boolean'
        )
      ).toBe(true);
    });

    it('does not disable an edge if no nodes are disabled', () => {
      const edgeDisabled = getEdgeDisabledNode(mockState);
      expect(Object.values(edgeDisabled)).toEqual(
        Object.values(edgeDisabled).map(() => false)
      );
    });

    const nodeID = getActiveSnapshotNodes(mockState)[0];
    const newMockState = reducer(mockState, toggleNodeDisabled(nodeID, true));
    const edgeDisabled = getEdgeDisabledNode(newMockState);
    const edges = getActiveSnapshotEdges(newMockState);
    const { edgeSources, edgeTargets } = newMockState;

    it('disables an edge if one of its nodes is disabled', () => {
      const disabledEdges = Object.keys(edgeDisabled).filter(
        id => edgeDisabled[id]
      );
      const disabledEdgesMock = edges.filter(
        id => edgeSources[id] === nodeID || edgeTargets[id] === nodeID
      );
      expect(disabledEdges).toEqual(disabledEdgesMock);
    });

    it('does not disable an edge if none of its nodes are disabled', () => {
      const enabledEdges = Object.keys(edgeDisabled).filter(
        id => !edgeDisabled[id]
      );
      const enabledEdgesMock = edges.filter(
        id => edgeSources[id] !== nodeID && edgeTargets[id] !== nodeID
      );
      expect(enabledEdges).toEqual(enabledEdgesMock);
    });
  });

  describe('getEdgeDisabledView', () => {
    it('returns an object', () => {
      expect(getEdgeDisabledView(mockState)).toEqual(expect.any(Object));
    });

    it("returns an object whose keys match the active snapshot's edges", () => {
      expect(Object.keys(getEdgeDisabledView(mockState))).toEqual(
        getActiveSnapshotEdges(mockState)
      );
    });

    it('returns an object whose values are all Booleans', () => {
      expect(
        Object.values(getEdgeDisabledView(mockState)).every(
          value => typeof value === 'boolean'
        )
      ).toBe(true);
    });

    describe('when view is set to combined', () => {
      const newMockState = reducer(mockState, changeView('combined'));
      const edgeDisabled = getEdgeDisabledView(newMockState);
      const edges = getActiveSnapshotEdges(newMockState);
      const { edgeSources, edgeTargets, nodeType } = newMockState;

      it('shows only edges connecting nodes of different types', () => {
        const enabledEdges = Object.keys(edgeDisabled).filter(
          id => !edgeDisabled[id]
        );
        const enabledEdgesMock = edges.filter(
          id => nodeType[edgeSources[id]] !== nodeType[edgeTargets[id]]
        );
        expect(enabledEdges).toEqual(enabledEdgesMock);
      });

      it('hides only edges connecting nodes of the same type', () => {
        const disabledEdges = Object.keys(edgeDisabled).filter(
          id => edgeDisabled[id]
        );
        const disabledEdgesMock = edges.filter(
          id => nodeType[edgeSources[id]] === nodeType[edgeTargets[id]]
        );
        expect(disabledEdges).toEqual(disabledEdgesMock);
      });
    });

    describe('when view is set to data', () => {
      const newMockState = reducer(mockState, changeView('data'));
      const edgeDisabled = getEdgeDisabledView(newMockState);
      const edges = getActiveSnapshotEdges(newMockState);
      const { edgeSources, edgeTargets, nodeType } = newMockState;

      it('shows only edges connecting nodes with type "data"', () => {
        const enabledEdges = Object.keys(edgeDisabled).filter(
          id => !edgeDisabled[id]
        );
        const enabledEdgesMock = edges.filter(
          id =>
            nodeType[edgeSources[id]] === 'data' &&
            nodeType[edgeTargets[id]] === 'data'
        );
        expect(enabledEdges).toEqual(enabledEdgesMock);
      });
    });

    describe('when view is set to task', () => {
      const newMockState = reducer(mockState, changeView('task'));
      const edgeDisabled = getEdgeDisabledView(newMockState);
      const edges = getActiveSnapshotEdges(newMockState);
      const { edgeSources, edgeTargets, nodeType } = newMockState;

      it('shows only edges connecting nodes with type "task"', () => {
        const enabledEdges = Object.keys(edgeDisabled).filter(
          id => !edgeDisabled[id]
        );
        const enabledEdgesMock = edges.filter(
          id =>
            nodeType[edgeSources[id]] === 'task' &&
            nodeType[edgeTargets[id]] === 'task'
        );
        expect(enabledEdges).toEqual(enabledEdgesMock);
      });
    });
  });

  describe('getEdgeDisabled', () => {
    it('returns an object', () => {
      expect(getEdgeDisabled(mockState)).toEqual(expect.any(Object));
    });

    it("returns an object whose keys match the active snapshot's edges", () => {
      expect(Object.keys(getEdgeDisabled(mockState))).toEqual(
        getActiveSnapshotEdges(mockState)
      );
    });

    it('returns an object whose values are all Booleans', () => {
      expect(
        Object.values(getEdgeDisabled(mockState)).every(
          value => typeof value === 'boolean'
        )
      ).toBe(true);
    });
  });

  describe('getEdges', () => {
    it('returns formatted edges as an array', () => {
      expect(getEdges(mockState)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            source: expect.any(String),
            target: expect.any(String),
            disabled: expect.any(Boolean)
          })
        ])
      );
    });
  });

  describe('getVisibleEdges', () => {
    it('gets only the visible edges', () => {
      expect(getVisibleEdges(mockState).map(d => d.disabled)).toEqual(
        expect.arrayContaining([false])
      );
    });
  });
});
