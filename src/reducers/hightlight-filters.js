import {
  HIGHLIGHT_FILTER_NODES,
  RESET_HIGHLIGHT_FILTER_NODES,
} from '../actions/filters';

// Reducer for highlightingfiltered nodes
const highlightFilterNodesReducer = (filterState = {}, action) => {
  const updateState = (newState) => Object.assign({}, filterState, newState);

  switch (action.type) {
    case HIGHLIGHT_FILTER_NODES:
      return updateState({
        from: action.highlightFilters.from,
        to: action.highlightFilters.to,
      });
    case RESET_HIGHLIGHT_FILTER_NODES:
      return {};
    default:
      return filterState;
  }
};

export default highlightFilterNodesReducer;
