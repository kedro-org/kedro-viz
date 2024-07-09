export const FILTER_NODES = 'FILTER_NODES';

export const filterNodes = (from, to) => ({
  type: FILTER_NODES,
  filters: { from, to },
});

export const APPLY_FILTERS = 'APPLY_FILTERS';

export const applyFilters = (apply) => ({
  type: APPLY_FILTERS,
  apply,
});

export const RESET_NODES_FILTER = 'RESET_NODES_FILTER';

export const resetNodesFilter = () => ({
  type: RESET_NODES_FILTER,
});
