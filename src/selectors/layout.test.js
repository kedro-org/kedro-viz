import { mockState } from '../utils/state.mock';
import {
  getChartSize,
  getGraph,
  getGraphSize,
  getLayoutNodes,
  getLayoutEdges,
  getSidebarWidth,
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

  describe('getGraphSize', () => {
    it('returns width, height and margin of the graph', () => {
      const graphSize = getGraphSize(mockState.lorem);
      expect(graphSize).toEqual(
        expect.objectContaining({
          height: expect.any(Number),
          marginx: expect.any(Number),
          marginy: expect.any(Number),
          width: expect.any(Number)
        })
      );
    });
  });

  describe('getSidebarWidth', () => {
    describe('if sidebar is visible', () => {
      it('reduces the chart width by 300 on wider screens', () => {
        expect(getSidebarWidth(true, 1000)).toEqual(300);
        expect(getSidebarWidth(true, 500)).toEqual(300);
      });

      it('sets sidebar width to zero on mobile', () => {
        expect(getSidebarWidth(true, 480)).toEqual(0);
        expect(getSidebarWidth(true, 320)).toEqual(0);
      });
    });

    describe('if sidebar is hidden', () => {
      it('sets sidebar width to zero on desktop', () => {
        expect(getSidebarWidth(false, 1000)).toEqual(0);
      });

      it('sets sidebar width to zero on mobile', () => {
        expect(getSidebarWidth(false, 480)).toEqual(0);
        expect(getSidebarWidth(false, 320)).toEqual(0);
      });
    });
  });

  describe('getChartSize', () => {
    it('returns a set of undefined properties if chartSize DOMRect is not supplied', () => {
      expect(getChartSize(mockState.lorem)).toEqual({
        height: undefined,
        left: undefined,
        outerHeight: undefined,
        outerWidth: undefined,
        sidebarWidth: undefined,
        top: undefined,
        width: undefined
      });
    });

    it('returns a DOMRect converted into an Object, with some extra properties', () => {
      const newMockState = {
        ...mockState.lorem,
        chartSize: { left: 100, top: 100, width: 1000, height: 1000 }
      };
      expect(getChartSize(newMockState)).toEqual({
        height: expect.any(Number),
        left: expect.any(Number),
        outerHeight: expect.any(Number),
        outerWidth: expect.any(Number),
        sidebarWidth: expect.any(Number),
        top: expect.any(Number),
        width: expect.any(Number)
      });
    });
  });

  describe('getZoomPosition', () => {
    it('returns an empty object if chartSize is unset', () => {
      expect(getZoomPosition(mockState.lorem)).toEqual({});
    });

    it('returns the updated chart zoom translation/scale if chartSize is set', () => {
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
