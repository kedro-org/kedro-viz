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
      expect(store.getState().graph.loading).not.toBe(true);
      calculateGraph(getGraphInput(mockState.animals))(store.dispatch);
      expect(store.getState().graph.loading).toBe(true);
    });

    it('sets loading to false after finishing calculation', () => {
      const store = createStore(reducer, mockState.animals);
      return calculateGraph(getGraphInput(mockState.animals))(
        store.dispatch
      ).then(() => {
        expect(store.getState().graph.loading).toBe(false);
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
            loading: false,
            newgraph: expect.any(Boolean),
            nodes: expect.any(Array),
            edges: expect.any(Array),
            size: expect.any(Object)
          })
        );
      });
    });

    it('uses newgraph if the flag is set', () => {
      const state = reducer(mockState.animals, changeFlag('newgraph', true));
      const store = createStore(reducer, state);
      return calculateGraph(getGraphInput(state))(store.dispatch).then(() => {
        expect(store.getState().graph.newgraph).toBe(true);
      });
    });

    it('uses dagre if the flag is not set', () => {
      const state = reducer(mockState.animals, changeFlag('newgraph', false));
      const store = createStore(reducer, state);
      return calculateGraph(getGraphInput(state))(store.dispatch).then(() => {
        expect(store.getState().graph.newgraph).toBe(false);
      });
    });
  });
});
