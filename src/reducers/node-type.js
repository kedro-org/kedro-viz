import { TOGGLE_TYPE_DISABLED } from '../actions/node-type';

function nodeTypeReducer(nodeTypeState = {}, action) {
  switch (action.type) {
    case TOGGLE_TYPE_DISABLED: {
      return Object.assign({}, nodeTypeState, {
        disabled: Object.assign({}, nodeTypeState.disabled, {
          [action.typeID]: action.disabled,
        }),
      });
    }
    default:
      return nodeTypeState;
  }
}

export default nodeTypeReducer;
