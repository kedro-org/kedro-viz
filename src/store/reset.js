import { loadState } from './helpers';

const { isArray } = Array;

// Determine whether something is an object literal (i.e. `{}`)
const isObject = (d) => typeof d === 'object' && d !== null && !isArray(d);

/**
 * Empty the store of all pipeline-related data entries,
 * while maintaining stored values from localStorage
 * @param {object} state Full state snapshot
 * @returns state State with pipeline info removed
 */
const resetPipelineState = (state) => {
  // State data type keys that should be reset, e.g. state.edge
  const types = ['edge', 'layer', 'modularPipeline', 'node', 'pipeline', 'tag'];
  const newState = { ...state };
  const localStorageState = loadState();

  for (const type of types) {
    const typeData = { ...state[type] };

    for (const key of Object.keys(typeData)) {
      if (localStorageState?.[type]?.[key]) {
        // Don't overwrite properties that are present in localStorage
        continue;
      } else if (isObject(typeData[key])) {
        typeData[key] = {};
      } else if (isArray(typeData[key])) {
        typeData[key] = [];
      }
    }
    newState[type] = typeData;
  }

  return newState;
};

export default resetPipelineState;
