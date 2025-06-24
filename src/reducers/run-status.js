import { UPDATE_RUN_STATUS_DATA } from '../actions/run-status';

const initialState = {
  nodes: {},
  datasets: {},
  pipeline: {},
};

function runStatusReducer(state = initialState, action) {
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
