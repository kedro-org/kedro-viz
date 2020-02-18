import config from '../config';

/**
 * Retrieve state data from localStorage
 * @return {Object} State
 */
export const loadState = () => {
  const { localStorageName } = config();
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
  const { localStorageName } = config();
  try {
    const newState = Object.assign(loadState(), state);
    const serializedState = JSON.stringify(newState);
    window.localStorage.setItem(localStorageName, serializedState);
  } catch (err) {
    console.error(err);
  }
};
