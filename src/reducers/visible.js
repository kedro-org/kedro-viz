import { TOGGLE_LAYERS, TOGGLE_SIDEBAR } from '../actions';

function visibleReducer(visibleState = {}, action) {
  switch (action.type) {
    case TOGGLE_LAYERS: {
      return Object.assign({}, visibleState, {
        layers: action.visible
      });
    }

    case TOGGLE_SIDEBAR: {
      return Object.assign({}, visibleState, {
        sidebar: action.visible
      });
    }

    default:
      return visibleState;
  }
}

export default visibleReducer;
