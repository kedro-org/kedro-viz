import { localStorageName } from '../config';

const noWindow = typeof window === 'undefined';

/**
 * Generate a project-specific storage key to prevent conflicts between different projects
 * Uses pipeline IDs to create a unique identifier for the project
 * @param {Array} pipelineIds List of pipeline IDs from the current project
 * @return {string} Project-specific key
 */
export const getProjectStorageKey = (pipelineIds = []) => {
  // Sort pipeline IDs to ensure consistent key even if order differs
  const sortedIds = Array.isArray(pipelineIds) ? pipelineIds.sort() : [];
  if (sortedIds.length === 0) {
    return '';
  }
  // Create a simple hash from the pipeline IDs
  return btoa(sortedIds.join('|')).substring(0, 16);
};

/**
 * Build the full localStorage key with project identifier
 * @param {string} baseKey Base storage key (e.g., 'KedroViz')
 * @param {string} projectKey Project-specific identifier
 * @return {string} Full storage key
 */
export const buildStorageKey = (baseKey, projectKey) => {
  if (!projectKey) {
    return baseKey;
  }
  return `${baseKey}::${projectKey}`;
};

/**
 * Retrieve state data from localStorage
 * @param {string} itemKey localStorage name
 * @return {Object} State
 */
export const loadLocalStorage = (itemKey = localStorageName) => {
  if (noWindow) {
    return {};
  }
  try {
    const serializedState = window.localStorage.getItem(itemKey);
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
 * @param {string} itemKey localStorage name
 * @param {Object} state New state object
 */
export const saveLocalStorage = (itemKey = localStorageName, state) => {
  if (noWindow) {
    return;
  }
  try {
    const newState = Object.assign(loadLocalStorage(itemKey), state);
    // Remove deprecated key from localStorage to suppress error.
    // This can be removed in future versions of KedroViz:
    if (newState.hasOwnProperty('nodeTypeDisabled')) {
      delete newState.nodeTypeDisabled;
    }
    const serializedState = JSON.stringify(newState);
    window.localStorage.setItem(itemKey, serializedState);
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
