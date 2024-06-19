export const FILTER_NODES = 'FILTER_NODES';

export const filterNodes = (from, to) => ({
  type: FILTER_NODES,
  filters: { from, to },
});

export const RESET_NODES_FILTER = 'RESET_NODES_FILTER';

export const resetNodesFilter = () => ({
  type: RESET_NODES_FILTER,
});
