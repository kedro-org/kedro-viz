import { TOGGLE_GRAPH_LOADING, UPDATE_GRAPH_LAYOUT } from '../actions/graph';

function nodeReducer(graphState = {}, action) {
  const updateState = newState => Object.assign({}, graphState, newState);

  switch (action.type) {
    case TOGGLE_GRAPH_LOADING: {
      return updateState({
        loading: action.loading
      });
    }

    case UPDATE_GRAPH_LAYOUT: {
      return updateState(action.graph);
    }

    default:
      return graphState;
  }
}

export default nodeReducer;
