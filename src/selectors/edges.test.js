import { mockState } from '../utils/state.mock';
import {
  getEdgeDisabledNode,
  getEdgeDisabled,
  addNewEdge,
  findTransitiveEdges,
  getTransitiveEdges,
  getVisibleEdges
} from './edges';
import { toggleNodesDisabled } from '../actions';
import reducer from '../reducers';

const getNodes = state => state.nodes;
const getEdges = state => state.edges;

describe('Selectors', () => {
  describe('getEdgeDisabledNode', () => {
    it('returns an object', () => {
      expect(getEdgeDisabledNode(mockState.lorem)).toEqual(expect.any(Object));
    });

    it("returns an object whose keys match the current pipeline's edges", () => {
      expect(Object.keys(getEdgeDisabledNode(mockState.lorem))).toEqual(
        getEdges(mockState.lorem)
      );
    });

    it('returns an object whose values are all Booleans', () => {
      expect(
        Object.values(getEdgeDisabledNode(mockState.lorem)).every(
          value => typeof value === 'boolean'
        )
      ).toBe(true);
    });

    it('does not disable an edge if no nodes are disabled', () => {
      const edgeDisabledValues = Object.values(
        getEdgeDisabledNode(mockState.lorem)
      );
      expect(edgeDisabledValues).toEqual(edgeDisabledValues.map(() => false));
    });

    const nodeID = getNodes(mockState.lorem)[0];
    const newMockState = reducer(
      mockState.lorem,
      toggleNodesDisabled([nodeID], true)
    );
    const edgeDisabled = getEdgeDisabledNode(newMockState);
    const edges = getEdges(newMockState);
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

  describe('getEdgeDisabled', () => {
    it('returns an object', () => {
      expect(getEdgeDisabled(mockState.lorem)).toEqual(expect.any(Object));
    });

    it("returns an object whose keys match the current pipeline's edges", () => {
      expect(Object.keys(getEdgeDisabled(mockState.lorem))).toEqual(
        getEdges(mockState.lorem)
      );
    });

    it('returns an object whose values are all Booleans', () => {
      expect(
        Object.values(getEdgeDisabled(mockState.lorem)).every(
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
    const edges = getEdges(mockState.lorem);
    const edge = edges[0];
    const source = mockState.lorem.edgeSources[edge];
    const disabledNode = mockState.lorem.edgeTargets[edge];
    const transitiveEdges = {};

    beforeEach(() => {
      transitiveEdges.edgeIDs = [];
      transitiveEdges.sources = {};
      transitiveEdges.targets = {};
    });

    describe('if all edges are enabled', () => {
      it('creates no transitive edges', () => {
        findTransitiveEdges(edges, transitiveEdges, mockState.lorem)(['dog']);
        expect(transitiveEdges.edgeIDs).toEqual([]);
      });
    });

    describe('if a task node is disabled', () => {
      // Create an altered state with a disabled node
      beforeEach(() => {
        const alteredMockState = reducer(
          mockState.lorem,
          toggleNodesDisabled([disabledNode], true)
        );
        findTransitiveEdges(edges, transitiveEdges, alteredMockState)([source]);
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
    const { edgeSources, edgeTargets } = mockState.lorem;
    // Find a node which has multiple inputs and outputs, which we can disable
    const disabledNode = getNodes(mockState.lorem).find(node => {
      const hasMultipleConnections = edgeNodes =>
        Object.values(edgeNodes).filter(edge => edge === node).length > 1;
      return (
        hasMultipleConnections(edgeSources) &&
        hasMultipleConnections(edgeTargets)
      );
    });
    const sourceEdge = getEdges(mockState.lorem).find(
      edge => edgeTargets[edge] === disabledNode
    );
    const source = edgeSources[sourceEdge];

    describe('if all edges are enabled', () => {
      it('creates no transitive edges', () => {
        expect(getTransitiveEdges(mockState.lorem)).toEqual({
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
          mockState.lorem,
          toggleNodesDisabled([disabledNode], true)
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
      const edgeDisabled = getEdgeDisabled(mockState.lorem);
      expect(
        getVisibleEdges(mockState.lorem).map(d => edgeDisabled[d.id])
      ).toEqual(expect.arrayContaining([false]));
    });

    it('formats the edges into an array of objects', () => {
      expect(getVisibleEdges(mockState.lorem)).toEqual(
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
      const { edgeSources, edgeTargets } = mockState.lorem;
      // Find a node which has multiple inputs and outputs, which we can disable
      const disabledNode = getNodes(mockState.lorem).find(node => {
        const hasMultipleConnections = edgeNodes =>
          Object.values(edgeNodes).filter(edge => edge === node).length > 1;
        return (
          hasMultipleConnections(edgeSources) &&
          hasMultipleConnections(edgeTargets)
        );
      });
      const alteredMockState = reducer(
        mockState.lorem,
        toggleNodesDisabled([disabledNode], true)
      );
      expect(getVisibleEdges(alteredMockState).length).toBeGreaterThan(
        getVisibleEdges(mockState.lorem).length
      );
    });
  });
});
