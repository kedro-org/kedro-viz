import {
  TOGGLE_EXPORT_MODAL,
  TOGGLE_LAYERS,
  TOGGLE_SIDEBAR,
  TOGGLE_MINIMAP
} from '../actions';

function visibleReducer(visibleState = {}, action) {
  switch (action.type) {
    case TOGGLE_EXPORT_MODAL: {
      return Object.assign({}, visibleState, {
        exportModal: action.visible
      });
    }

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

    case TOGGLE_MINIMAP: {
      return Object.assign({}, visibleState, {
        miniMap: action.visible
      });
    }

    default:
      return visibleState;
  }
}

export default visibleReducer;
