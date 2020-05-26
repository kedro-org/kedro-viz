import { mockState } from '../utils/state.mock';
import { getEdgeDisabled } from './disabled';
import { addNewEdge, getTransitiveEdges, getVisibleEdges } from './edges';
import { toggleNodesDisabled } from '../actions/nodes';
import reducer from '../reducers';

const getNodeIDs = state => state.node.ids;
const getEdgeIDs = state => state.edge.ids;
const getEdgeSources = state => state.edge.sources;
const getEdgeTargets = state => state.edge.targets;

describe('Selectors', () => {
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

  describe('getTransitiveEdges', () => {
    const edgeSources = getEdgeSources(mockState.lorem);
    const edgeTargets = getEdgeTargets(mockState.lorem);
    // Find a node which has multiple inputs and outputs, which we can disable
    const disabledNode = getNodeIDs(mockState.lorem).find(node => {
      const hasMultipleConnections = edgeNodes =>
        Object.values(edgeNodes).filter(edge => edge === node).length > 1;
      return (
        hasMultipleConnections(edgeSources) &&
        hasMultipleConnections(edgeTargets)
      );
    });
    const sourceEdge = getEdgeIDs(mockState.lorem).find(
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
      // Find a node which has multiple inputs and outputs, which we can disable
      const disabledNodeID = getNodeIDs(mockState.lorem).find(node => {
        const hasMultipleConnections = edgeNodes =>
          Object.values(edgeNodes).filter(edge => edge === node).length > 1;
        return (
          hasMultipleConnections(getEdgeSources(mockState.lorem)) &&
          hasMultipleConnections(getEdgeTargets(mockState.lorem))
        );
      });
      const alteredMockState = reducer(
        mockState.lorem,
        toggleNodesDisabled([disabledNodeID], true)
      );
      expect(getVisibleEdges(alteredMockState).length).toBeGreaterThan(
        getVisibleEdges(mockState.lorem).length
      );
    });
  });
});
