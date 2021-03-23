export const TOGGLE_MODULAR_PIPELINE_ACTIVE = 'TOGGLE_MODULAR_PIPELINE_ACTIVE';

/**
 * Toggle a modular pipeline item's highlighting on/off (or array of tags)
 * @param {string|Array} modularPipelineIDs Modular pipeline id(s)
 * @param {Boolean} active True if tag(s) active
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

export const TOGGLE_MODULAR_PIPELINE_FILTER = 'TOGGLE_MODULAR_PIPELINE_FILTER';

/**
 * Toggle a tag's filtering on/off (or array of tags)
 * @param {string|Array} modularPipelineIDs Modular pipeline id(s)
 * @param {Boolean} enabled True if tag(s) enabled
 */
export function toggleModularPipelineFilter(modularPipelineIDs, enabled) {
  return {
    type: TOGGLE_MODULAR_PIPELINE_FILTER,
    tagIDs: Array.isArray(modularPipelineIDs)
      ? modularPipelineIDs
      : [modularPipelineIDs],
    enabled,
  };
}
