import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import watch from 'redux-watch';
import reducer from '../reducers';
import { getGraphInput } from '../selectors/layout';
import { calculateGraph } from '../actions/graph';
import { saveState, pruneFalseyKeys } from './helpers';

/**
 * Watch the getGraphInput selector, and dispatch an asynchronous action to
 * update state.graph via a web worker when it changes.
 * @param {object} store Redux store
 */
const updateGraphOnChange = store => {
  const watchGraph = watch(() => getGraphInput(store.getState()));
  store.subscribe(
    watchGraph(graphInput => {
      store.dispatch(calculateGraph(graphInput));
    })
  );
};

/**
 * Save selected state properties to window.localStorage
 * @param {object} state Redux state snapshot
 */
const saveStateToLocalStorage = state => {
  saveState({
    node: {
      disabled: pruneFalseyKeys(state.node.disabled)
    },
    nodeType: {
      disabled: state.nodeType.disabled
    },
    pipeline: {
      active: state.pipeline.active
    },
    layer: {
      visible: state.layer.visible
    },
    textLabels: state.textLabels,
    theme: state.theme,
    visible: state.visible,
    flag: state.flags
  });
};

/**
 * Configure initial state and create the Redux store
 * @param {Object} initialState Initial Redux state (from initial-state.js)
 * @return {Object} Redux store
 */
export default function configureStore(initialState) {
  const store = createStore(reducer, initialState, applyMiddleware(thunk));
  updateGraphOnChange(store);

  store.subscribe(() => {
    saveStateToLocalStorage(store.getState());
  });

  return store;
}
