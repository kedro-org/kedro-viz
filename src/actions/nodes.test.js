import { createStore } from 'redux';
import reducer from '../reducers';
import { mockState } from '../utils/state.mock';
import {
  toggleNodeClicked,
  TOGGLE_NODE_CLICKED,
  TOGGLE_NODE_DATA_LOADING,
  toggleNodeDataLoading,
  getNodeDataUrl,
  loadNodeData
} from './nodes';

describe('node actions', () => {
  describe('updateClickedNode', () => {
    it('should create an action to update the clicked node', () => {
      const node = { id: 'abc123' };
      const expectedAction = {
        type: TOGGLE_NODE_CLICKED,
        node
      };
      expect(toggleNodeClicked(node)).toEqual(expectedAction);
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

  describe('getNodeDataUrl', () => {
    it('should contain the node id in node data url', () => {
      const node = { id: 'abc123' };
      expect(getNodeDataUrl(node)).toEqual(expect.stringContaining('abc123'));
    });
  });

  describe('loadNodeData', () => {
    describe('if loading data asynchronously', () => {
      it('should set loading to true immediately', () => {
        const store = createStore(reducer, mockState.json);
        expect(store.getState().loading.node).toBe(false);
        loadNodeData('new active id')(store.dispatch, store.getState);
        expect(store.getState().loading.node).toBe(true);
      });

      it('should load the new data, reset the state and added the fetched node id under pipeline.node.fetched', async () => {
        const store = createStore(reducer, mockState.json);
        const node = { id: 'new active id' };
        await loadNodeData(node)(store.dispatch, store.getState);
        const state = store.getState();
        expect([node.id]).toEqual(
          expect.arrayContaining(state.pipeline.node.fetched)
        );
      });

      it('should set loading to false when complete', async () => {
        const store = createStore(reducer, mockState.json);
        const node = { id: 'new active id' };
        await loadNodeData(node)(store.dispatch, store.getState);
        expect(store.getState().loading.node).toBe(false);
      });

      it('should do nothing if the Node data is already fetched', async () => {
        const store = createStore(reducer, mockState.json);
        const { dispatch, getState, subscribe } = store;
        const node = { id: 'new active id' };
        const storeListener = jest.fn();

        subscribe(storeListener);
        await loadNodeData(node)(dispatch, getState);

        loadNodeData(node)(dispatch, getState);
        expect(storeListener).toHaveBeenCalledTimes(1);
      });
    });
  });
});
