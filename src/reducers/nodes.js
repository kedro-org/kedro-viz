import {
  TOGGLE_NODE_CLICKED,
  TOGGLE_NODES_DISABLED,
  TOGGLE_NODE_HOVERED
} from '../actions/nodes';
import { UPDATE_ACTIVE_PIPELINE } from '../actions';

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
        clicked: action.nodeIDs.includes(nodeState.clicked)
          ? null
          : nodeState.clicked,
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

    case UPDATE_ACTIVE_PIPELINE: {
      return updateState({
        clicked: null,
        hovered: null
      });
    }

    default:
      return nodeState;
  }
}

export default nodeReducer;
