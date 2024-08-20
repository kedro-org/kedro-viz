export const APPLY_SLICE_PIPELINE = 'APPLY_SLICE_PIPELINE';

export const applySlicePipeline = (apply) => {
  return async function (dispatch) {
    dispatch({
      type: APPLY_SLICE_PIPELINE,
      apply,
    });
  };
};

export const SET_SLICE_PIPELINE = 'SET_SLICE_PIPELINE';

export const setSlicePipeline = (from, to) => {
  return async function (dispatch) {
    dispatch({
      type: SET_SLICE_PIPELINE,
      slice: { from, to },
    });
  };
};

export const RESET_SLICE_PIPELINE = 'RESET_SLICE_PIPELINE';

export const resetSlicePipeline = () => ({
  type: RESET_SLICE_PIPELINE,
  slice: { from: null, to: null },
});
