import { UPDATE_RUN_STATUS_DATA } from '../actions/run-status';

const initialState = {
  runStatus: {
    nodes: {},
    datasets: {},
    pipeline: {},
  },
};

function runStatusReducer(state = initialState, action) {
  switch (action.type) {
    case UPDATE_RUN_STATUS_DATA:
      return {
        ...state,
        runStatus: {
          ...state.runStatus,
          ...action.data,
        },
      };
    default:
      return state;
  }
}

export default runStatusReducer;
