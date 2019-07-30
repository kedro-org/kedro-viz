import { mockState } from '../utils/state.mock';
import {
  getActiveSnapshotEdges,
  getEdgeDisabledNode,
  getEdgeDisabledView,
  getEdgeDisabled,
  addNewEdge,
  findTransitiveEdges,
  getTransitiveEdges,
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
      const edgeDisabledValues = Object.values(getEdgeDisabledNode(mockState));
      expect(edgeDisabledValues).toEqual(edgeDisabledValues.map(() => false));
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

  describe('addNewEdge', () => {
    const transitiveEdges = {};
    beforeEach(() => {
      transitiveEdges.edgeIDs = [];
      transitiveEdges.sources = {};
      transitiveEdges.targets = {};
    });

    it('adds a new edge to the list of edge IDs', () => {
      addNewEdge('foo', 'bar', transitiveEdges);
      expect(transitiveEdges.edgeIDs).toEqual(['foo|bar']);
    });

    it('adds a new source to the sources dictionary', () => {
      addNewEdge('source_name', 'target', transitiveEdges);
      expect(transitiveEdges.sources).toEqual({
        'source_name|target': 'source_name'
      });
    });

    it('adds a new target to the targets dictionary', () => {
      addNewEdge('source', 'target name', transitiveEdges);
      expect(transitiveEdges.targets).toEqual({
        'source|target name': 'target name'
      });
    });

    it('does not add a new edge if it already exists', () => {
      addNewEdge('foo', 'bar', transitiveEdges);
      addNewEdge('foo', 'bar', transitiveEdges);
      expect(transitiveEdges.edgeIDs).toEqual(['foo|bar']);
    });
  });

  describe('findTransitiveEdges', () => {
    const activeSnapshotEdges = getActiveSnapshotEdges(mockState);
    const edge = activeSnapshotEdges[0];
    const source = mockState.edgeSources[edge];
    const disabledNode = mockState.edgeTargets[edge];
    const transitiveEdges = {};

    beforeEach(() => {
      transitiveEdges.edgeIDs = [];
      transitiveEdges.sources = {};
      transitiveEdges.targets = {};
    });

    describe('if all edges are enabled', () => {
      it('creates no transitive edges', () => {
        findTransitiveEdges(activeSnapshotEdges, transitiveEdges, mockState)([
          'dog'
        ]);
        expect(transitiveEdges.edgeIDs).toEqual([]);
      });
    });

    describe('if a task node is disabled', () => {
      // Create an altered state with a disabled node
      beforeEach(() => {
        const alteredMockState = reducer(
          mockState,
          toggleNodeDisabled(disabledNode, true)
        );
        findTransitiveEdges(
          activeSnapshotEdges,
          transitiveEdges,
          alteredMockState
        )([source]);
      });

      it('creates transitive edges matching the source node', () => {
        expect(transitiveEdges.edgeIDs).toEqual(
          expect.arrayContaining([expect.stringContaining(source)])
        );
      });

      it('does not create transitive edges that do not contain the source node', () => {
        expect(transitiveEdges.edgeIDs).not.toEqual(
          expect.arrayContaining([expect.not.stringContaining(source)])
        );
      });
    });
  });

  describe('getTransitiveEdges', () => {
    const { edgeSources, edgeTargets } = mockState;
    // Find a node which has multiple inputs and outputs, which we can disable
    const disabledNode = getActiveSnapshotNodes(mockState).find(node => {
      const hasMultipleConnections = edgeNodes =>
        Object.values(edgeNodes).filter(edge => edge === node).length > 1;
      return (
        hasMultipleConnections(edgeSources) &&
        hasMultipleConnections(edgeTargets)
      );
    });
    const sourceEdge = getActiveSnapshotEdges(mockState).find(
      edge => edgeTargets[edge] === disabledNode
    );
    const source = edgeSources[sourceEdge];

    describe('if all edges are enabled', () => {
      it('creates no transitive edges', () => {
        expect(getTransitiveEdges(mockState)).toEqual({
          edgeIDs: [],
          sources: {},
          targets: {}
        });
      });
    });

    describe('if a task node is disabled', () => {
      // Create an altered state with a disabled node
      let alteredMockState;
      beforeEach(() => {
        alteredMockState = reducer(
          mockState,
          toggleNodeDisabled(disabledNode, true)
        );
      });

      it('creates transitive edges matching the source node', () => {
        expect(getTransitiveEdges(alteredMockState).edgeIDs).toEqual(
          expect.arrayContaining([expect.stringContaining(source)])
        );
      });

      it('creates transitive edges not matching the source node', () => {
        expect(getTransitiveEdges(alteredMockState).edgeIDs).toEqual(
          expect.arrayContaining([expect.not.stringContaining(source)])
        );
      });

      it('does not create transitive edges that contain the disabled node', () => {
        expect(getTransitiveEdges(alteredMockState).edgeIDs).not.toEqual(
          expect.arrayContaining([expect.stringContaining(disabledNode)])
        );
      });
    });
  });

  describe('getVisibleEdges', () => {
    it('gets only the visible edges', () => {
      const edgeDisabled = getEdgeDisabled(mockState);
      expect(getVisibleEdges(mockState).map(d => edgeDisabled[d.id])).toEqual(
        expect.arrayContaining([false])
      );
    });

    it('formats the edges into an array of objects', () => {
      expect(getVisibleEdges(mockState)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            source: expect.any(String),
            target: expect.any(String)
          })
        ])
      );
    });

    it('includes transitive edges when necessary', () => {
      const { edgeSources, edgeTargets } = mockState;
      // Find a node which has multiple inputs and outputs, which we can disable
      const disabledNode = getActiveSnapshotNodes(mockState).find(node => {
        const hasMultipleConnections = edgeNodes =>
          Object.values(edgeNodes).filter(edge => edge === node).length > 1;
        return (
          hasMultipleConnections(edgeSources) &&
          hasMultipleConnections(edgeTargets)
        );
      });
      const alteredMockState = reducer(
        mockState,
        toggleNodeDisabled(disabledNode, true)
      );
      expect(getVisibleEdges(alteredMockState).length).toBeGreaterThan(
        getVisibleEdges(mockState).length
      );
    });
  });
});
