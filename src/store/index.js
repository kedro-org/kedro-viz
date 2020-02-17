import { createStore } from 'redux';
import reducer from '../reducers';
import { resetData } from '../actions';
import getInitialState from './initial-state';
import loadData from './load-data';
import { saveState } from './helpers';

/**
 * Configure initial state and create the Redux store
 * @param {Object} props Initial React props passed to App component
 * @return {Object} Redux store
 */
export default function configureStore(props) {
  /**
   * Dispatch an action to update the store with new pipeline data
   * @param {Object} normalizedData Normalised state data
   */
  const resetStoreData = normalizedData => {
    if (store) {
      store.dispatch(resetData(normalizedData));
    }
  };

  const pipelineData = loadData(props.data, resetStoreData);
  const initialState = getInitialState(pipelineData, props);

  const store = createStore(reducer, initialState);

  store.subscribe(() => {
    const { textLabels, theme, typeDisabled } = store.getState();
    saveState({ textLabels, theme, typeDisabled });
  });

  return store;
}
