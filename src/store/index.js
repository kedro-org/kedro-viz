import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import watch from 'redux-watch';
import reducer from '../reducers';
import { getGraphInput } from '../selectors/layout';
import { calculateGraph } from '../actions/graph';
import { saveState, pruneFalseyKeys } from './helpers';

/**
 * Configure initial state and create the Redux store
 * @param {Object} initialState Initial Redux state (from initial-state.js)
 * @return {Object} Redux store
 */
export default function configureStore(initialState) {
  const store = createStore(reducer, initialState, applyMiddleware(thunk));

  let watchGraph = watch(() => getGraphInput(store.getState()));
  store.subscribe(
    watchGraph(graphInput => {
      store.dispatch(calculateGraph(graphInput));
    })
  );

  store.subscribe(() => {
    const state = store.getState();
    // Selectively save state properties to localStorage
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
  });

  return store;
}
