import { createStore } from 'redux';
import reducer from '../reducers';
import { saveState } from '../utils';

export default function configureStore(initialState) {
  const store = createStore(reducer, initialState);

  store.subscribe(() => {
    const { parameters, textLabels, theme, view } = store.getState();
    saveState({ parameters, textLabels, theme, view });
  });

  return store;
}
