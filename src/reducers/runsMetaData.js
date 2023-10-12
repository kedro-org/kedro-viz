import {
  TOGGLE_BOOKMARK,
  UPDATE_RUN_TITLE,
  UPDATE_RUN_NOTES,
} from '../actions';

function runsMetaDataReducer(runsMetaDataState = {}, action) {
  switch (action.type) {
    case TOGGLE_BOOKMARK: {
      return Object.assign({}, runsMetaDataState, {
        [action.runId]: {
          ...runsMetaDataState[action.runId],
          bookmark: action.bookmark,
        },
      });
    }
    case UPDATE_RUN_TITLE: {
      return Object.assign({}, runsMetaDataState, {
        [action.runId]: {
          ...runsMetaDataState[action.runId],
          title: action.title,
        },
      });
    }
    case UPDATE_RUN_NOTES: {
      return Object.assign({}, runsMetaDataState, {
        [action.runId]: {
          ...runsMetaDataState[action.runId],
          notes: action.notes,
        },
      });
    }

    default:
      return runsMetaDataState;
  }
}

export default runsMetaDataReducer;
