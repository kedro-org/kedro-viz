import {
  CHANGE_ACTIVE_PIPELINE,
  CHANGE_VIEW,
  TOGGLE_PARAMETERS,
  TOGGLE_TEXT_LABELS,
} from '../actions';

function reducer(state = {}, action) {
  switch (action.type) {
    case CHANGE_ACTIVE_PIPELINE:
      return Object.assign({}, state, {
        activePipelineData: action.pipeline
      });
    case CHANGE_VIEW:
      return Object.assign({}, state, {
        view: action.view,
      });
    case TOGGLE_TEXT_LABELS:
      return Object.assign({}, state, {
        textLabels: action.textLabels,
      });
    case TOGGLE_PARAMETERS:
      return Object.assign({}, state, {
        parameters: action.parameters,
      });
    default:
      return state;
  }
}

export default reducer;
