export const TOGGLE_TYPE_DISABLED = 'TOGGLE_TYPE_DISABLED';

/**
 * Toggle a node-type's visibility on/off
 * @param {string} typeID Type id
 * @param {Boolean} disabled True if type is disabled
 */
export function toggleTypeDisabled(typeID, disabled) {
  return {
    type: TOGGLE_TYPE_DISABLED,
    typeID,
    disabled,
  };
}
