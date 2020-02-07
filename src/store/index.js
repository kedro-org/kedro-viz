import { createStore } from 'redux';
import reducer from '../reducers';
import { saveState } from './helpers';
import checkFontLoaded from './check-font-loaded';

export default function configureStore(initialState) {
  const store = createStore(reducer, initialState);

  store.subscribe(() => {
    const { textLabels, theme, typeDisabled } = store.getState();
    saveState({ textLabels, theme, typeDisabled });
  });

  checkFontLoaded(store);

  return store;
}
