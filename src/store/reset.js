import { mergeLocalStorage } from './initial-state';

/**
 * Empty the store of all pipeline-related data entries,
 * while maintaining stored values from localStorage
 * @param {object} state Full state snapshot
 * @returns state State with pipeline info removed
 */
const resetPipelineState = (state) => {
  const { isArray } = Array;
  const isObject = (d) => typeof d === 'object' && d !== null && !isArray(d);
  // State data type keys that should be reset, e.g. state.edge
  const types = ['edge', 'layer', 'modularPipeline', 'node', 'pipeline', 'tag'];
  const newState = { ...state };
  for (const type of types) {
    const typeData = { ...state[type] };
    for (const key of Object.keys(typeData)) {
      if (isObject(typeData[key])) {
        typeData[key] = {};
      } else if (isArray(typeData[key])) {
        typeData[key] = [];
      }
    }
    newState[type] = typeData;
  }
  // Reapply erased localStorage values:
  return mergeLocalStorage(newState);
};

export default resetPipelineState;
