import {
  TOGGLE_PIPELINE_LOADING,
  UPDATE_ACTIVE_PIPELINE
} from '../actions/pipelines';

function pipelineReducer(pipelineState = {}, action) {
  switch (action.type) {
    case UPDATE_ACTIVE_PIPELINE: {
      return Object.assign({}, pipelineState, {
        active: action.pipeline
      });
    }

    case TOGGLE_PIPELINE_LOADING: {
      return Object.assign({}, pipelineState, {
        loading: action.loading
      });
    }

    default:
      return pipelineState;
  }
}

export default pipelineReducer;
