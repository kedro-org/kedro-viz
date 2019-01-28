import {
  CHANGE_ACTIVE_PIPELINE,
  TOGGLE_TEXT_LABELS,
  CHANGE_VIEW,
} from '../actions';

function reducer(state = {}, action) {
  switch (action.type) {
    case CHANGE_VIEW:
      return Object.assign({}, state, {
        view: action.view,
      });
    case TOGGLE_TEXT_LABELS:
      return Object.assign({}, state, {
        textLabels: action.textLabels,
      });
    case CHANGE_ACTIVE_PIPELINE:
      return Object.assign({}, state, {
        activePipelineData: action.pipeline
      });
    default:
      return state;
  }
}

export default reducer;
