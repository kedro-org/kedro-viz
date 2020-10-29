import {
  TOGGLE_NODE_CLICKED,
  TOGGLE_NODES_DISABLED,
  TOGGLE_NODE_HOVERED,
  ADD_NODE_METADATA
} from '../actions/nodes';
import { UPDATE_ACTIVE_PIPELINE } from '../actions/pipelines';

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

    case ADD_NODE_METADATA: {
      return updateState({
        code: Object.assign({}, nodeState.code, {
          [action.id]: action.data.code
        }),
        codeLocation: Object.assign({}, nodeState.codeLocation, {
          [action.id]: action.data.codeLocation
        }),
        docString: Object.assign({}, nodeState.docString, {
          [action.id]: action.data.docString
        }),
        parameters: Object.assign({}, nodeState.parameters, {
          [action.id]: action.data.parameters
        }),
        dataset_location: Object.assign({}, nodeState.dataset_location, {
          [action.id]: action.data.dataset_location
        }),
        dataset_type: Object.assign({}, nodeState.dataset_type, {
          [action.id]: action.data.dataset_type
        })
      });
    }

    default:
      return nodeState;
  }
}

export default nodeReducer;
