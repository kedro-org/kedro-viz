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

export const TOGGLE_MODULAR_PIPELINE_FILTER = 'TOGGLE_MODULAR_PIPELINE_FILTER';

/**
 * Toggle a modular pipeline's filtering on/off (or array of modular pipelines)
 * @param {string|Array} modularPipelineIDs Modular pipeline id(s)
 * @param {Boolean} enabled True if modular pipeline(s) enabled
 */
export function toggleModularPipelineFilter(modularPipelineIDs, enabled) {
  return {
    type: TOGGLE_MODULAR_PIPELINE_FILTER,
    modularPipelineIDs: Array.isArray(modularPipelineIDs)
      ? modularPipelineIDs
      : [modularPipelineIDs],
    enabled,
  };
}

export const TOGGLE_MODULAR_PIPELINE_CONTRACTED =
  'TOGGLE_MODULAR_PIPELINE_CONTRACTED';

/**
 * Toggle whether a modular pipeline is expanded or contracted
 * @param {string} modularPipelineID Modular pipeline identifier
 * @param {boolean} contracted False if expanded
 */
export function toggleModularPipelineContracted(modularPipelineID, contracted) {
  return {
    type: TOGGLE_MODULAR_PIPELINE_CONTRACTED,
    modularPipelineID,
    contracted,
  };
}
