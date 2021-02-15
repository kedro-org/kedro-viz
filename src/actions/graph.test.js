import { createStore } from 'redux';
import reducer from '../reducers';
import { mockState } from '../utils/state.mock';
import { changeFlag } from './index';
import { calculateGraph, updateGraph } from './graph';
import { getGraphInput } from '../selectors/layout';

describe('graph actions', () => {
  describe('calculateGraph', () => {
    it('returns updateGraph action if input is falsey', () => {
      expect(calculateGraph(null)).toEqual(updateGraph(null));
    });

    it('sets loading to true immediately', () => {
      const store = createStore(reducer, mockState.animals);
      expect(store.getState().loading.graph).not.toBe(true);
      calculateGraph(getGraphInput(mockState.animals))(store.dispatch);
      expect(store.getState().loading.graph).toBe(true);
    });

    it('sets loading to false and graph visibility to true after finishing calculation', () => {
      const store = createStore(reducer, mockState.animals);
      return calculateGraph(getGraphInput(mockState.animals))(
        store.dispatch
      ).then(() => {
        const state = store.getState();
        expect(state.loading.graph).toBe(false);
        expect(state.visible.graph).toBe(true);
      });
    });

    it('calculates a graph', () => {
      const state = Object.assign({}, mockState.animals);
      delete state.graph;
      const store = createStore(reducer, state);
      expect(store.getState().graph).toEqual({});
      return calculateGraph(getGraphInput(state))(store.dispatch).then(() => {
        expect(store.getState().graph).toEqual(
          expect.objectContaining({
            oldgraph: expect.any(Boolean),
            nodes: expect.any(Array),
            edges: expect.any(Array),
            size: expect.any(Object),
          })
        );
      });
    });

    it('uses new graph by default if the oldgraph flag is not set', () => {
      const state = reducer(mockState.animals, changeFlag('oldgraph', false));
      const store = createStore(reducer, state);
      return calculateGraph(getGraphInput(state))(store.dispatch).then(() => {
        expect(store.getState().graph.oldgraph).toBe(false);
      });
    });

    it('uses dagre if the oldgraph flag is set to true', () => {
      const state = reducer(mockState.animals, changeFlag('oldgraph', true));
      const store = createStore(reducer, state);
      return calculateGraph(getGraphInput(state))(store.dispatch).then(() => {
        expect(store.getState().graph.oldgraph).toBe(true);
      });
    });
  });
});
