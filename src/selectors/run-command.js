import { createSelector } from 'reselect';

const getFilters = (state) => state.filters;

export const getRunCommand = createSelector([getFilters], (filters) => {
  const { from, to } = filters;

  if (!from && !to) {
    return null;
  }

  return `kedro run --from-nodes=${from} --to-nodes=${to}`;
});
