import { createSelector } from 'reselect';

const getFlagsState = state => state.flags;

/**
 * Get current flag status from state
 */
export const getCurrentFlags = createSelector(
  [getFlagsState],
  flags => ({ ...flags })
);
