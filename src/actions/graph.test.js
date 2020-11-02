import { createStore } from 'redux';
import reducer from '../reducers';
import animals from '../utils/data/animals.mock';
import { mockState, prepareState } from '../utils/state.mock';
import { changeFlag } from './index';
import { calculateGraph, updateGraph } from './graph';
import { getGraphInput } from '../selectors/layout';

describe('graph actions', () => {
  describe('calculateGraph', () => {
    it('returns updateGraph action if input is falsey', () => {
      expect(calculateGraph(null)).toEqual(updateGraph(null));
    });

    it('does not set loading to true if the dataset is small', () => {
      const store = createStore(reducer, mockState.animals);
      calculateGraph(getGraphInput(mockState.animals))(store.dispatch);
      expect(store.getState().loading.graph).not.toBe(true);
    });

    it('sets loading to true immediately, if the dataset is sufficiently large', () => {
      // Multiple the nodes and edges in mockState.animals until they're > 300
      const newArray = Array(20).fill();
      const multiplyData = fn =>
        newArray.reduce((data, d, i) => data.concat(fn(i)), []);
      const nodes = multiplyData(i =>
        animals.nodes.map(node => ({
          ...node,
          id: node.id + i
        }))
      );
      const edges = multiplyData(i =>
        animals.edges.map(edge => ({
          source: edge.source + i,
          target: edge.target + i
        }))
      );
      const data = {
        ...animals,
        nodes,
        edges
      };
      const state = prepareState({ data });
      const store = createStore(reducer, state);
      expect(store.getState().loading.graph).not.toBe(true);
      calculateGraph(getGraphInput(state))(store.dispatch);
      expect(store.getState().loading.graph).toBe(true);
    });

    it('sets loading to false after finishing calculation', () => {
      const store = createStore(reducer, mockState.animals);
      return calculateGraph(getGraphInput(mockState.animals))(
        store.dispatch
      ).then(() => {
        expect(store.getState().loading.graph).toBe(false);
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
