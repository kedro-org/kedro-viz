import { UPDATE_RUN_STATUS_DATA } from '../actions/run-status';

function runStatusReducer(
  state = {
    nodes: {},
    datasets: {},
    pipeline: {},
  },
  action
) {
  switch (action.type) {
    case UPDATE_RUN_STATUS_DATA:
      return {
        ...state,
        ...action.data,
      };
    default:
      return state;
  }
}

export default runStatusReducer;
