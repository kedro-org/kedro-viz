import {
  TOGGLE_NODE_CLICKED,
  TOGGLE_NODES_DISABLED,
  TOGGLE_NODE_HOVERED
} from '../actions/nodes';

function nodeReducer(nodeState = {}, action) {
  const updateState = newState => Object.assign({}, nodeState, newState);

  switch (action.type) {
    case TOGGLE_NODE_CLICKED: {
      return updateState({
        clicked: action.nodeClicked
      });
    }

    case TOGGLE_NODES_DISABLED: {
      return updateState({
        disabled: action.nodeIDs.reduce(
          (disabled, id) =>
            Object.assign({}, disabled, {
              [id]: action.isDisabled
            }),
          nodeState.disabled
        )
      });
    }

    case TOGGLE_NODE_HOVERED: {
      return updateState({
        hovered: action.nodeHovered
      });
    }

    default:
      return nodeState;
  }
}

export default nodeReducer;
