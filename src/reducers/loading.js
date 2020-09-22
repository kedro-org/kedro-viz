import { TOGGLE_GRAPH_LOADING } from '../actions/graph';
import { TOGGLE_PIPELINE_LOADING } from '../actions/pipelines';

function loadingReducer(loadingState = {}, action) {
  switch (action.type) {
    case TOGGLE_PIPELINE_LOADING: {
      return Object.assign({}, loadingState, {
        pipeline: action.loading
      });
    }

    case TOGGLE_GRAPH_LOADING: {
      return Object.assign({}, loadingState, {
        graph: action.loading
      });
    }

    default:
      return loadingState;
  }
}

export default loadingReducer;
