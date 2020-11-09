import { createStore } from 'redux';
import reducer from '../reducers';
import { mockState } from '../utils/state.mock';
import {
  TOGGLE_NODE_DATA_LOADING,
  toggleNodeDataLoading,
  loadNodeData,
  addNodeMetadata,
  ADD_NODE_METADATA
} from './nodes';

const parametersID = 'f1f1425b';

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
        loadNodeData('parametersID')(store.dispatch, store.getState);
        expect(store.getState().loading.node).toBe(true);
      });

      it('should load the new data, reset the state and added the fetched node id under node.fetched', async () => {
        const store = createStore(reducer, mockState.json);
        const node = { id: parametersID };
        await loadNodeData(node.id)(store.dispatch, store.getState);
        const state = store.getState();
        expect(state.node.fetched[node.id]).toEqual(true);
      });

      it('should set loading to false when complete', async () => {
        const store = createStore(reducer, mockState.json);
        const node = { id: parametersID };
        await loadNodeData(node.id)(store.dispatch, store.getState);
        expect(store.getState().loading.node).toBe(false);
      });

      it('should do nothing if the Node data is already fetched', async () => {
        const store = createStore(reducer, mockState.json);
        const { dispatch, getState, subscribe } = store;
        const node = { id: parametersID };
        const storeListener = jest.fn();

        subscribe(storeListener);
        await loadNodeData(node.id)(dispatch, getState);
        loadNodeData(node.id)(dispatch, getState);
        // The store would have been called 5 times: 4 times for the first round to fetch the node information,
        // one more time for toggleNodeCliced
        expect(storeListener).toHaveBeenCalledTimes(5);
      });

      it('should do nothing if nodeID is not present', async () => {
        const store = createStore(reducer, mockState.json);
        const { dispatch, getState, subscribe } = store;
        const node = { id: null };
        const storeListener = jest.fn();

        subscribe(storeListener);
        loadNodeData(node.id)(dispatch, getState);
        // the store should be called only once for 'toggleNodeClicked'
        expect(storeListener).toHaveBeenCalledTimes(1);
      });
    });
  });
});
