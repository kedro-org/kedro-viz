export const TOGGLE_TAG_ACTIVE = 'TOGGLE_TAG_ACTIVE';

/**
 * Toggle a tag's highlighting on/off
 * @param {string} tagID Tag id
 * @param {Boolean} active True if tag is active
 */
export function toggleTagActive(tagID, active) {
  return {
    type: TOGGLE_TAG_ACTIVE,
    tagID,
    active
  };
}

export const TOGGLE_TAG_FILTER = 'TOGGLE_TAG_FILTER';

/**
 * Toggle a tag on/off
 * @param {string} tagID Tag id
 * @param {Boolean} enabled True if tag is enabled
 */
export function toggleTagFilter(tagID, enabled) {
  return {
    type: TOGGLE_TAG_FILTER,
    tagID,
    enabled
  };
}
