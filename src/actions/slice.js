export const APPLY_SLICE = 'APPLY_SLICE';

export const applySlice = (apply) => {
  return async function (dispatch) {
    dispatch({
      type: APPLY_SLICE,
      apply,
    });
  };
};

export const SLICE_PIPELINE = 'SLICE_PIPELINE';

export const slicePipeline = (from, to) => {
  return async function (dispatch) {
    dispatch({
      type: SLICE_PIPELINE,
      slice: { from, to },
    });
  };
};

export const RESET_SLICE_PIPELINE = 'RESET_SLICE_PIPELINE';

export const resetSlicePipeline = () => ({
  type: RESET_SLICE_PIPELINE,
  slice: { from: null, to: null },
});
