/**
 * Empty the store of all pipeline data
 * @param {object} state Full state snapshot
 * @returns state
 */
const resetPipelineState = (state) => {
  const { isArray } = Array;
  const isObject = (d) => typeof d === 'object' && d !== null && !isArray(d);
  const keys = ['edge', 'layer', 'modularPipeline', 'node', 'pipeline', 'tag'];
  const newState = { ...state };
  for (const i of keys) {
    const property = state[i];
    const newProperty = { ...property };
    for (const key of Object.keys(property)) {
      if (isObject(property[key])) {
        newProperty[key] = {};
      } else if (isArray(property[key])) {
        newProperty[key] = [];
      }
    }
    newState[i] = newProperty;
  }
  return newState;
};

export default resetPipelineState;
