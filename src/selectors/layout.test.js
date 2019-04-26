import { mockState } from '../utils/data.mock';
import { getGraph, getLayout, getZoomPosition } from './layout';
import { getVisibleNodes } from './nodes';
import { getVisibleEdges } from './edges';
import { updateChartSize } from '../actions';
import reducer from '../reducers';

describe('Selectors', () => {
  describe('getGraph', () => {
    const graph = getGraph(mockState);
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
      expect(graph.nodes()).toEqual(getVisibleNodes(mockState).map(d => d.id));
      const edgeIDs = graph.edges().map(edge => graph.edge(edge).id);
      expect(edgeIDs).toEqual(getVisibleEdges(mockState).map(d => d.id));
    });
  });

  describe('getLayout', () => {
    const layout = getLayout(mockState);

    it('returns a properly-formatted list of nodes', () => {
      expect(layout.nodes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            type: expect.stringMatching(/data|task/),
            height: expect.any(Number),
            width: expect.any(Number),
            x: expect.any(Number),
            y: expect.any(Number),
            active: expect.any(Boolean),
            disabled: expect.any(Boolean)
          })
        ])
      );
    });

    it('returns a properly-formatted list of edges', () => {
      expect(layout.edges).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            disabled: expect.any(Boolean),
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
      expect(getZoomPosition(mockState)).toEqual({
        scale: 1,
        translateX: 0,
        translateY: 0
      });
    });

    it('returns the updated chart zoom translation/scale if set', () => {
      const newMockState = reducer(
        mockState,
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
