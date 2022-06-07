export const TOGGLE_MODULAR_PIPELINE_ACTIVE = 'TOGGLE_MODULAR_PIPELINE_ACTIVE';

/**
 * Toggle a modular pipeline item's highlighting on/off (or array of modular pipelines)
 * @param {string|Array} modularPipelineIDs Modular pipeline id(s)
 * @param {Boolean} active True if modualr pipeline(s) active
 */
export function toggleModularPipelineActive(modularPipelineIDs, active) {
  return {
    type: TOGGLE_MODULAR_PIPELINE_ACTIVE,
    modularPipelineIDs: Array.isArray(modularPipelineIDs)
      ? modularPipelineIDs
      : [modularPipelineIDs],
    active,
  };
}

export const TOGGLE_SINGLE_MODULAR_PIPELINE_EXPANDED =
  'TOGGLE_SINGLE_MODULAR_PIPELINE_EXPANDED';

/**
 * Toggle a singular modular pipeline to be expanded.
 * @param {string} modularPipelineID
 */
export function toggleSingleModularPipelineExpanded(modularPipelineID) {
  return {
    type: TOGGLE_SINGLE_MODULAR_PIPELINE_EXPANDED,
    modularPipelineID,
  };
}

export const TOGGLE_MODULAR_PIPELINES_EXPANDED =
  'TOGGLE_MODULAR_PIPELINES_EXPANDED';

/**
 * Toggle a set of modular pipelines to be expanded.
 * @param {Array[Number]} expandedIDs
 */
export function toggleModularPipelinesExpanded(expandedIDs) {
  return {
    type: TOGGLE_MODULAR_PIPELINES_EXPANDED,
    expandedIDs,
  };
}
