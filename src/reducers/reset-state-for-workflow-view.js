import { RESET_STATE_FOR_WORKFLOW_VIEW } from '../actions';

function resetStateForWorkflowViewReducer(state = {}, action) {
  const updateState = (newState) => Object.assign({}, state, newState);

  switch (action.type) {
    case RESET_STATE_FOR_WORKFLOW_VIEW: {
      return updateState({
        expandAllPipelines: true,
        // Reset the state for workflow view will come here
      });
    }

    default:
      return state;
  }
}

export default resetStateForWorkflowViewReducer;
