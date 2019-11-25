import { mockState } from '../utils/state.mock';
import {
  getGraph,
  getLayoutNodes,
  getLayoutEdges,
  getZoomPosition
} from './layout';
import { getVisibleNodes } from './nodes';
import { getVisibleEdges } from './edges';
import { updateChartSize } from '../actions';
import reducer from '../reducers';

describe('Selectors', () => {
  describe('getGraph', () => {
    const graph = getGraph(mockState.lorem);
    it('calculates chart layout and returns a Dagre object', () => {
      expect(graph).toEqual(
        expect.objectContaining({
          graph: expect.any(Function),
          nodes: expect.any(Function),
          node: expect.any(Function),
          edges: expect.any(Function),
          edge: expect.any(Function)
        })
      );
    });

    it('returns a complete list of node and edge IDs', () => {
      expect(graph.nodes()).toEqual(
        getVisibleNodes(mockState.lorem).map(d => d.id)
      );
      const edgeIDs = graph.edges().map(edge => graph.edge(edge).id);
      expect(edgeIDs).toEqual(getVisibleEdges(mockState.lorem).map(d => d.id));
    });
  });

  describe('getLayoutNodes', () => {
    it('returns a properly-formatted list of nodes', () => {
      const nodes = getLayoutNodes(mockState.lorem);
      expect(nodes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            fullName: expect.any(String),
            type: expect.stringMatching(/data|task/),
            height: expect.any(Number),
            width: expect.any(Number),
            x: expect.any(Number),
            y: expect.any(Number),
            active: expect.any(Boolean)
          })
        ])
      );
    });
  });

  describe('getLayoutEdges', () => {
    it('returns a properly-formatted list of edges', () => {
      const edges = getLayoutEdges(mockState.lorem);
      expect(edges).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            source: expect.any(String),
            target: expect.any(String),
            points: expect.arrayContaining([
              expect.objectContaining({
                x: expect.any(Number),
                y: expect.any(Number)
              })
            ])
          })
        ])
      );
    });
  });

  describe('getZoomPosition', () => {
    it('returns a default chart zoom translation/scale if none is specified', () => {
      expect(getZoomPosition(mockState.lorem)).toEqual({
        scale: 1,
        translateX: 0,
        translateY: 0
      });
    });

    it('returns the updated chart zoom translation/scale if set', () => {
      const newMockState = reducer(
        mockState.lorem,
        updateChartSize({ width: 100, height: 100 })
      );
      const newZoomPos = getZoomPosition(newMockState);
      expect(newZoomPos.scale).toEqual(expect.any(Number));
      expect(newZoomPos.translateX).toEqual(expect.any(Number));
      expect(newZoomPos.translateY).toEqual(expect.any(Number));
      expect(newZoomPos).not.toEqual(
        expect.objectContaining({
          scale: 1,
          translateX: 0,
          translateY: 0
        })
      );
    });
  });
});
