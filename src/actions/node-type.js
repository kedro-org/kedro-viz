export const TOGGLE_TYPE_DISABLED = 'TOGGLE_TYPE_DISABLED';

/**
 * The default enabled / disabled value for all types is 'unset', meaning not explicitly set by user.
 * In practice 'unset' acts like enabled but is a distinct state for UI purposes.
 * The value `0` is chosen to be falsy, JSON serializable but distinct from `false`.
 */
export const NODE_TYPE_DISABLED_UNSET = 0;

/**
 * Toggle one or more node-type's visibility on/off
 * @param {string|Object} typeIDs A single type id string, or an object map of type id to disabled booleans
 * @param {?Boolean} disabled True if type is disabled (when passing a single type id string)
 */
export function toggleTypeDisabled(typeIDs, disabled) {
  return {
    type: TOGGLE_TYPE_DISABLED,
    typeIDs: typeof typeIDs === 'string'
      ? { [typeIDs]: disabled }
      : typeIDs,
  };
}
