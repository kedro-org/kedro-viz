import { createStore } from 'redux';
import reducer from '../reducers';
import { saveState } from './helpers';

/**
 * Configure initial state and create the Redux store
 * @param {Object} initialState Initial Redux state (from initial-state.js)
 * @return {Object} Redux store
 */
export default function configureStore(initialState) {
  const store = createStore(reducer, initialState);

  store.subscribe(() => {
    const { textLabels, theme, nodeType } = store.getState();
    saveState({ textLabels, theme, nodeTypeDisabled: nodeType.disabled });
  });

  return store;
}
