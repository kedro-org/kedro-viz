import { mockState } from '../utils/state.mock';
import { getEdgeDisabled } from './disabled';
import { addNewEdge, getTransitiveEdges } from './edges';
import { getInputOutputDataEdges, getVisibleEdges } from './contracted';
import { toggleNodesDisabled } from '../actions/nodes';
import { toggleFocusMode } from '../actions';
import reducer from '../reducers';

const getNodeIDs = (state) => state.node.ids;
const getEdgeIDs = (state) => state.edge.ids;
const getEdgeSources = (state) => state.edge.sources;
const getEdgeTargets = (state) => state.edge.targets;

describe('Selectors', () => {
  describe('addNewEdge', () => {
    const transitiveEdges = {};
    beforeEach(() => {
      transitiveEdges.ids = {};
      transitiveEdges.sources = {};
      transitiveEdges.targets = {};
    });

    it('adds a new edge to the list of edge IDs', () => {
      addNewEdge('foo', 'bar', transitiveEdges);
      expect(transitiveEdges.ids).toEqual({ 'foo|bar': true });
    });

    it('adds a new source to the sources dictionary', () => {
      addNewEdge('source_name', 'target', transitiveEdges);
      expect(transitiveEdges.sources).toEqual({
        'source_name|target': 'source_name',
      });
    });

    it('adds a new target to the targets dictionary', () => {
      addNewEdge('source', 'target name', transitiveEdges);
      expect(transitiveEdges.targets).toEqual({
        'source|target name': 'target name',
      });
    });

    it('does not add a new edge if it already exists', () => {
      addNewEdge('foo', 'bar', transitiveEdges);
      addNewEdge('foo', 'bar', transitiveEdges);
      expect(transitiveEdges.ids).toEqual({ 'foo|bar': true });
    });
  });

  describe('getTransitiveEdges', () => {
    const edgeSources = getEdgeSources(mockState.animals);
    const edgeTargets = getEdgeTargets(mockState.animals);
    // Find a node which has multiple inputs and outputs, which we can disable
    const disabledNode = getNodeIDs(mockState.animals).find((node) => {
      const hasMultipleConnections = (edgeNodes) =>
        Object.values(edgeNodes).filter((edge) => edge === node).length > 1;
      return (
        hasMultipleConnections(edgeSources) &&
        hasMultipleConnections(edgeTargets)
      );
    });
    const sourceEdge = getEdgeIDs(mockState.animals).find(
      (edge) => edgeTargets[edge] === disabledNode
    );
    const source = edgeSources[sourceEdge];

    describe('if all edges are enabled', () => {
      it('creates no transitive edges', () => {
        expect(getTransitiveEdges(mockState.animals)).toEqual({
          ids: {},
          sources: {},
          targets: {},
        });
      });
    });

    describe('if a task node is disabled', () => {
      // Create an altered state with a disabled node
      let alteredMockState;
      beforeEach(() => {
        alteredMockState = reducer(
          mockState.animals,
          toggleNodesDisabled([disabledNode], true)
        );
      });

      it('creates transitive edges matching the source node', () => {
        expect(Object.keys(getTransitiveEdges(alteredMockState).ids)).toEqual(
          expect.arrayContaining([expect.stringContaining(source)])
        );
      });

      it('creates transitive edges not matching the source node', () => {
        expect(Object.keys(getTransitiveEdges(alteredMockState).ids)).toEqual(
          expect.arrayContaining([expect.not.stringContaining(source)])
        );
      });

      it('does not create transitive edges that contain the disabled node', () => {
        expect(Object.keys(getTransitiveEdges(alteredMockState).ids)).not.toEqual(
          expect.arrayContaining([expect.stringContaining(disabledNode)])
        );
      });
    });
  });

  describe('getVisibleEdges', () => {
    it('gets only the visible edges', () => {
      const edgeDisabled = getEdgeDisabled(mockState.animals);
      expect(
        getVisibleEdges(mockState.animals).map((d) => edgeDisabled[d.id])
      ).toEqual(expect.arrayContaining([false]));
    });

    it('formats the edges into an array of objects', () => {
      expect(getVisibleEdges(mockState.animals)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            source: expect.any(String),
            target: expect.any(String),
          }),
        ])
      );
    });

    it('includes transitive edges when necessary', () => {
      // Find a node which has multiple inputs and outputs, which we can disable
      const disabledNodeID = getNodeIDs(mockState.animals).find((node) => {
        const hasMultipleConnections = (edgeNodes) =>
          Object.values(edgeNodes).filter((edge) => edge === node).length > 1;
        return (
          hasMultipleConnections(getEdgeSources(mockState.animals)) &&
          hasMultipleConnections(getEdgeTargets(mockState.animals))
        );
      });
      const alteredMockState = reducer(
        mockState.animals,
        toggleNodesDisabled([disabledNodeID], true)
      );
      expect(getVisibleEdges(alteredMockState).length).toBeGreaterThan(
        getVisibleEdges(mockState.animals).length
      );
    });
  });

  describe('getInputOutputDataEdges', () => {
    it('includes input output edges related to a modular pipeline in the returned object', () => {
      const newMockState = reducer(
        mockState.animals,
        toggleFocusMode({ id: 'pipeline1' })
      );

      expect(getInputOutputDataEdges(newMockState)).toHaveProperty(
        '0ae9e4de|15586b7a'
      );
    });
  });
});
