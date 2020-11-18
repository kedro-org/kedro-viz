import { TOGGLE_TAG_ACTIVE, TOGGLE_TAG_FILTER } from '../actions/tags';

const activeChanges = action =>
  action.tagIDs.reduce((result, tagID) => {
    result[tagID] = action.active;
    return result;
  }, {});

const enabledChanges = action =>
  action.tagIDs.reduce((result, tagID) => {
    result[tagID] = action.enabled;
    return result;
  }, {});

function tagReducer(tagState = {}, action) {
  const updateState = newState => Object.assign({}, tagState, newState);

  switch (action.type) {
    case TOGGLE_TAG_ACTIVE: {
      return updateState({
        active: Object.assign({}, tagState.active, activeChanges(action))
      });
    }

    case TOGGLE_TAG_FILTER: {
      return updateState({
        enabled: Object.assign({}, tagState.enabled, enabledChanges(action))
      });
    }

    default:
      return tagState;
  }
}

export default tagReducer;
