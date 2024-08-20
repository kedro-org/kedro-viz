import {
  SET_SLICE_PIPELINE,
  RESET_SLICE_PIPELINE,
  APPLY_SLICE_PIPELINE,
} from '../actions/slice';

// Reducer for filtering nodes
const slicePipelineReducer = (sliceState = {}, action) => {
  const updateState = (newState) => Object.assign({}, sliceState, newState);

  switch (action.type) {
    case APPLY_SLICE_PIPELINE:
      return updateState({
        apply: action.apply,
      });
    case SET_SLICE_PIPELINE:
      return updateState({
        from: action.slice.from,
        to: action.slice.to,
      });
    case RESET_SLICE_PIPELINE:
      return {
        from: null,
        to: null,
        apply: false,
      };
    default:
      return sliceState;
  }
};

export default slicePipelineReducer;
