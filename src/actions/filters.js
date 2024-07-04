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
});
