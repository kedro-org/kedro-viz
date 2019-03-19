import { createStore } from 'redux';
import reducer from '../reducers';

export default function configureStore(initialState) {
  const store = createStore(reducer, initialState);
  return store;
}
