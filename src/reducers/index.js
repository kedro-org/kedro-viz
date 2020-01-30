import {
  RESET_DATA,
  TOGGLE_NODE_CLICKED,
  TOGGLE_NODES_DISABLED,
  TOGGLE_NODE_HOVERED,
  TOGGLE_TAG_ACTIVE,
  TOGGLE_TAG_FILTER,
  TOGGLE_TEXT_LABELS,
  TOGGLE_THEME,
  TOGGLE_TYPE_DISABLED,
  UPDATE_CHART_SIZE,
  UPDATE_FONT_LOADED
} from '../actions';

function reducer(state = {}, action) {
  const updateState = newState => Object.assign({}, state, newState);

  switch (action.type) {
    case RESET_DATA:
      return updateState(action.data);

    case TOGGLE_NODE_CLICKED: {
      return updateState({
        nodeClicked: action.nodeClicked
      });
    }

    case TOGGLE_NODES_DISABLED: {
      return updateState({
        nodeDisabled: action.nodeIDs.reduce(
          (nodeDisabled, id) =>
            Object.assign({}, nodeDisabled, {
              [id]: action.isDisabled
            }),
          state.nodeDisabled
        )
      });
    }

    case TOGGLE_NODE_HOVERED: {
      return updateState({
        nodeHovered: action.nodeHovered
      });
    }

    case TOGGLE_TEXT_LABELS:
      return updateState({
        textLabels: action.textLabels
      });

    case TOGGLE_TAG_ACTIVE: {
      return updateState({
        tagActive: Object.assign({}, state.tagActive, {
          [action.tagID]: action.active
        })
      });
    }

    case TOGGLE_TAG_FILTER: {
      return updateState({
        tagEnabled: Object.assign({}, state.tagEnabled, {
          [action.tagID]: action.enabled
        })
      });
    }

    case TOGGLE_THEME: {
      return updateState({
        theme: action.theme
      });
    }

    case TOGGLE_TYPE_DISABLED: {
      return updateState({
        typeDisabled: Object.assign({}, state.typeDisabled, {
          [action.typeID]: action.disabled
        })
      });
    }

    case UPDATE_CHART_SIZE: {
      return updateState({
        chartSize: action.chartSize
      });
    }

    case UPDATE_FONT_LOADED: {
      return updateState({
        fontLoaded: action.fontLoaded
      });
    }

    default:
      return state;
  }
}

export default reducer;
