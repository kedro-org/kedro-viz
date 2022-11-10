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
export const saveState = (state) => {
  if (noWindow) {
    return;
  }
  try {
    const newState = Object.assign(loadState(), state);
    // Remove deprecated key from localStorage to suppress error.
    // This can be removed in future versions of KedroViz:
    if (newState.hasOwnProperty('nodeTypeDisabled')) {
      delete newState.nodeTypeDisabled;
    }
    const serializedState = JSON.stringify(newState);
    window.localStorage.setItem(localStorageName, serializedState);
  } catch (err) {
    console.error(err);
  }
};

/**
 * Remove unnecessary keys to prevent them being stored in state forever
 * @param {Object} obj An object containing keys and booleans
 * @return {Object} A new clone object but with the falsey keys removed
 */
export const pruneFalseyKeys = (obj) => {
  const newObj = {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key) && obj[key]) {
      newObj[key] = obj[key];
    }
  }
  return newObj;
};
