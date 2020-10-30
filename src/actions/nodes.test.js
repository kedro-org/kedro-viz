import { createStore } from 'redux';
import reducer from '../reducers';
import { mockState } from '../utils/state.mock';
import {
  toggleNodeClicked,
  TOGGLE_NODE_CLICKED,
  TOGGLE_NODE_DATA_LOADING,
  toggleNodeDataLoading,
  loadNodeData,
  addNodeMetadata,
  ADD_NODE_METADATA
} from './nodes';

jest.mock('../store/load-data.js');

describe('node actions', () => {
  describe('addNodeMetadata', () => {
    it('should create an action to add node metadata', () => {
      const data = { id: 'abc123', data: { parameters: { test: 'test' } } };
      const expectedAction = {
        type: ADD_NODE_METADATA,
        data
      };
      expect(addNodeMetadata(data)).toEqual(expectedAction);
    });
  });

  describe('toggleLoading', () => {
    it('should create an action to toggle when the node data is loading', () => {
      const loading = true;
      const expectedAction = {
        type: TOGGLE_NODE_DATA_LOADING,
        loading
      };
      expect(toggleNodeDataLoading(loading)).toEqual(expectedAction);
    });
  });

  describe('loadNodeData', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    describe('if loading data asynchronously', () => {
      it('should set loading to true immediately', () => {
        const store = createStore(reducer, mockState.json);
        expect(store.getState().loading.node).toBe(false);
        loadNodeData('f1f1425b')(store.dispatch, store.getState);
        expect(store.getState().loading.node).toBe(true);
      });

      it('should load the new data, reset the state and added the fetched node id under node.fetched', async () => {
        const store = createStore(reducer, mockState.json);
        const node = { id: 'f1f1425b' };
        await loadNodeData(node.id)(store.dispatch, store.getState);
        const state = store.getState();
        console.log(state.node.fetched[node.id])
        expect(state.node.fetched[node.id]).toEqual(true);
      });

      it('should set loading to false when complete', async () => {
        const store = createStore(reducer, mockState.json);
        const node = { id: 'f1f1425b' };
        await loadNodeData(node.id)(store.dispatch, store.getState);
        expect(store.getState().loading.node).toBe(false);
      });

      it('should do nothing if the Node data is already fetched', async () => {
        const store = createStore(reducer, mockState.json);
        const { dispatch, getState, subscribe } = store;
        const node = { id: 'f1f1425b' };
        const storeListener = jest.fn();

        subscribe(storeListener);
        await loadNodeData(node.id)(dispatch, getState);

        // we have set it at 5 times given the set of calls for the first listener, but this test is subject to change to a simplier test once we have set up a 
        // way to directly set the 'fetched' value of the store
        loadNodeData(node.id)(dispatch, getState);
        expect(storeListener).toHaveBeenCalledTimes(5); 
      });
    });
  });
});
