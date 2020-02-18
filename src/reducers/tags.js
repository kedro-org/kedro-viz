import { TOGGLE_TAG_ACTIVE, TOGGLE_TAG_FILTER } from '../actions';

function tagReducer(tagState = {}, action) {
  const updateState = newState => Object.assign({}, tagState, newState);

  switch (action.type) {
    case TOGGLE_TAG_ACTIVE: {
      return updateState({
        active: Object.assign({}, tagState.active, {
          [action.tagID]: action.active
        })
      });
    }

    case TOGGLE_TAG_FILTER: {
      return updateState({
        enabled: Object.assign({}, tagState.enabled, {
          [action.tagID]: action.enabled
        })
      });
    }

    default:
      return tagState;
  }
}

export default tagReducer;
