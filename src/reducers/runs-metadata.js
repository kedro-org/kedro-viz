import {
  TOGGLE_BOOKMARK,
  UPDATE_RUN_TITLE,
  UPDATE_RUN_NOTES,
} from '../actions';

function runsMetadataReducer(runsMetadataState = {}, action) {
  switch (action.type) {
    case TOGGLE_BOOKMARK: {
      return Object.assign({}, runsMetadataState, {
        [action.runId]: {
          ...runsMetadataState[action.runId],
          bookmark: action.bookmark,
        },
      });
    }
    case UPDATE_RUN_TITLE: {
      return Object.assign({}, runsMetadataState, {
        [action.runId]: {
          ...runsMetadataState[action.runId],
          title: action.title,
        },
      });
    }
    case UPDATE_RUN_NOTES: {
      return Object.assign({}, runsMetadataState, {
        [action.runId]: {
          ...runsMetadataState[action.runId],
          notes: action.notes,
        },
      });
    }

    default:
      return runsMetadataState;
  }
}

export default runsMetadataReducer;
