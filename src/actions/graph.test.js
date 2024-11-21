import { createStore } from 'redux';
import reducer from '../reducers';
import { calculateGraph, updateGraph } from './graph';
import { getGraphInput } from '../selectors/layout';
import { prepareState } from '../utils/state.mock';
import spaceflights from '../utils/data/spaceflights.mock.json';
import spaceflightsReordered from '../utils/data/spaceflights_reordered.mock.json';
import { toggleModularPipelinesExpanded } from '../actions/modular-pipelines';

describe('graph actions', () => {
  const getMockState = (data) =>
    prepareState({
      data,
      beforeLayoutActions: [
        () =>
          toggleModularPipelinesExpanded(['data_science', 'data_processing']),
      ],
    });

  describe('calculateGraph', () => {
    it('returns updateGraph action if input is falsey', () => {
      expect(calculateGraph(null)).toEqual(updateGraph(null));
    });

    it('sets loading to true immediately', () => {
      const store = createStore(reducer, getMockState(spaceflights));
      expect(store.getState().loading.graph).not.toBe(true);
      calculateGraph(getGraphInput(getMockState(spaceflights)))(store.dispatch);
      expect(store.getState().loading.graph).toBe(true);
    });

    it('sets loading to false and graph visibility to true after finishing calculation', () => {
      const store = createStore(reducer, getMockState(spaceflights));
      return calculateGraph(getGraphInput(getMockState(spaceflights)))(
        store.dispatch
      ).then(() => {
        const state = store.getState();
        expect(state.loading.graph).toBe(false);
        expect(state.visible.graph).toBe(true);
      });
    });

    it('calculates a graph', () => {
      const initialState = { ...getMockState(spaceflights), graph: {} };
      const store = createStore(reducer, initialState);
      expect(store.getState().graph).toEqual({});
      return calculateGraph(getGraphInput(initialState))(store.dispatch).then(
        () => {
          expect(store.getState().graph).toEqual(
            expect.objectContaining({
              nodes: expect.any(Array),
              edges: expect.any(Array),
              size: expect.any(Object),
            })
          );
        }
      );
    });

    it('compares deterministic flowchart of two differently ordered same projects', () => {
      const store1 = createStore(reducer, getMockState(spaceflights));
      const store2 = createStore(reducer, getMockState(spaceflightsReordered));

      return calculateGraph(getGraphInput(getMockState(spaceflights)))(
        store1.dispatch
      )
        .then(() =>
          calculateGraph(getGraphInput(getMockState(spaceflightsReordered)))(
            store2.dispatch
          )
        )
        .then(() => {
          // Get node coordinates for both graphs
          const graph1Coords = store1.getState().graph.nodes.map((node) => ({
            id: node.id,
            x: node.x,
            y: node.y,
          }));

          const graph2Coords = store2.getState().graph.nodes.map((node) => ({
            id: node.id,
            x: node.x,
            y: node.y,
          }));

          // Verify coordinates consistency between both graphs
          expect(graph1Coords).toEqual(expect.arrayContaining(graph2Coords));
        });
    });
  });
});
