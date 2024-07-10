export const APPLY_FILTERS = 'APPLY_FILTERS';

export const applyFilters = (apply) => {
  return async function (dispatch, getState) {
    dispatch({
      type: APPLY_FILTERS,
      apply,
    });
  };
};

export const FILTER_NODES = 'FILTER_NODES';

export const filterNodes = (from, to) => {
  return async function (dispatch, getState) {
    dispatch({
      type: FILTER_NODES,
      filters: { from, to },
    });
  };
};

export const RESET_FILTER_NODES = 'RESET_FILTER_NODES';

export const resetFilterNodes = () => ({
  type: RESET_FILTER_NODES,
  filters: { from: null, to: null },
});
