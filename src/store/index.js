import { createStore } from 'redux';
import reducer from '../reducers';
import { saveState } from '../utils';

export default function configureStore(initialState) {
  const store = createStore(reducer, initialState);

  store.subscribe(() => {
    const { textLabels, theme } = store.getState();
    saveState({ textLabels, theme });
  });

  return store;
}
