import {
  CHANGE_ACTIVE_PIPELINE
} from '../actions';

function reducer(state = {}, action) {
  switch (action.type) {
    case CHANGE_ACTIVE_PIPELINE:
      return Object.assign({}, state, {
        activePipelineData: action.pipeline
      });
    default:
      return state;
  }
}

export default reducer;
