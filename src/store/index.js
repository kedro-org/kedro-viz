import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import watch from 'redux-watch';
import reducer from '../reducers';
import { getGraphInput } from '../selectors/layout';
import { calculateGraph } from '../actions/graph';
import { saveState } from './helpers';

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
    const { textLabels, theme, nodeType, visible, flags } = store.getState();

    saveState({
      textLabels,
      theme,
      nodeTypeDisabled: nodeType.disabled,
      visible,
      flags
    });
  });

  return store;
}
