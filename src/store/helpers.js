import { localStorageName } from '../config';

const noWindow = typeof window === 'undefined';

/**
 * Retrieve state data from localStorage
 * @return {Object} State
 */
export const loadState = () => {
  if (noWindow) {
    return {};
  }
  try {
    const serializedState = window.localStorage.getItem(localStorageName);
    if (serializedState === null) {
      return {};
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error(err);
    return {};
  }
};

/**
 * Save updated state to localStorage
 * @param {Object} state New state object
 */
export const saveState = state => {
  if (noWindow) {
    return;
  }
  try {
    const newState = Object.assign(loadState(), state);
    const serializedState = JSON.stringify(newState);
    window.localStorage.setItem(localStorageName, serializedState);
  } catch (err) {
    console.error(err);
  }
};
