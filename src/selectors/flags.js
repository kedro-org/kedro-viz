import { createSelector } from 'reselect';

const getFlagsState = state => state.flags;

export const getFlags = createSelector(
  [getFlagsState],
  flags => ({ ...flags })
);
