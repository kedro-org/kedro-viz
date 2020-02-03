import {
  CHANGE_VIEW,
  RESET_DATA,
  TOGGLE_NODE_CLICKED,
  TOGGLE_NODE_DISABLED,
  TOGGLE_NODES_DISABLED,
  TOGGLE_NODE_HOVERED,
  TOGGLE_PARAMETERS,
  TOGGLE_TAG_ACTIVE,
  TOGGLE_TAG_FILTER,
  TOGGLE_TEXT_LABELS,
  TOGGLE_THEME,
  UPDATE_CHART_SIZE,
  UPDATE_FONT_LOADED
} from '../actions';

function reducer(state = {}, action) {
  switch (action.type) {
    case CHANGE_VIEW:
      return Object.assign({}, state, {
        view: action.view
      });

    case RESET_DATA:
      return Object.assign({}, state, action.data);

    case TOGGLE_NODE_CLICKED: {
      return Object.assign({}, state, {
        nodeClicked: action.nodeClicked
      });
    }

    case TOGGLE_NODE_DISABLED: {
      return Object.assign({}, state, {
        nodeDisabled: Object.assign({}, state.nodeDisabled, {
          [action.nodeID]: action.isDisabled
        })
      });
    }

    case TOGGLE_NODES_DISABLED: {
      return Object.assign({}, state, {
        nodeDisabled: action.nodeIDs.reduce(
          (disabled, id) =>
            Object.assign({}, disabled, {
              [id]: action.isDisabled
            }),
          state.nodeDisabled
        )
      });
    }

    case TOGGLE_NODE_HOVERED: {
      return Object.assign({}, state, {
        nodeHovered: action.nodeHovered
      });
    }

    case TOGGLE_PARAMETERS: {
      const paramIDs = state.nodes.filter(id => state.nodeIsParam[id]);
      return Object.assign({}, state, {
        nodeDisabled: paramIDs.reduce(
          (disabled, id) =>
            Object.assign({}, disabled, {
              [id]: !action.parameters
            }),
          state.nodeDisabled
        ),
        parameters: action.parameters
      });
    }

    case TOGGLE_TEXT_LABELS:
      return Object.assign({}, state, {
        textLabels: action.textLabels
      });

    case TOGGLE_TAG_ACTIVE: {
      return Object.assign({}, state, {
        tagActive: Object.assign({}, state.tagActive, {
          [action.tagID]: action.active
        })
      });
    }

    case TOGGLE_TAG_FILTER: {
      return Object.assign({}, state, {
        tagEnabled: Object.assign({}, state.tagEnabled, {
          [action.tagID]: action.enabled
        })
      });
    }

    case TOGGLE_THEME: {
      return Object.assign({}, state, {
        theme: action.theme
      });
    }

    case UPDATE_CHART_SIZE: {
      return Object.assign({}, state, {
        chartSize: action.chartSize
      });
    }

    case UPDATE_FONT_LOADED: {
      return Object.assign({}, state, {
        fontLoaded: action.fontLoaded
      });
    }

    default:
      return state;
  }
}

export default reducer;
