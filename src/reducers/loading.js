import {
  TOGGLE_GRAPH_LOADING,
  TOGGLE_DISPLAY_LARGE_GRAPH,
  TOGGLE_IS_LARGE,
  UPDATE_NODE_COUNT
} from '../actions/graph';
import { TOGGLE_PIPELINE_LOADING } from '../actions/pipelines';
import { TOGGLE_NODE_DATA_LOADING } from '../actions/nodes';

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

    case TOGGLE_NODE_DATA_LOADING: {
      return Object.assign({}, loadingState, {
        node: action.loading
      });
    }

    case TOGGLE_IS_LARGE: {
      return Object.assign({}, loadingState, {
        isLarge: action.isLarge
      });
    }

    case TOGGLE_DISPLAY_LARGE_GRAPH: {
      return Object.assign({}, loadingState, {
        displayLargeGraph: action.displayLargeGraph
      });
    }

    default:
      return loadingState;
  }
}

export default loadingReducer;
