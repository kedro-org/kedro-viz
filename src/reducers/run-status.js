import {
  UPDATE_RUN_STATUS_DATA,
  SET_RUN_STATUS_LOADING,
  SET_RUN_STATUS_ERROR,
} from '../actions/run-status';

const initialState = {
  // Structured format node-ID based data
  groupedData: {
    nodes: {},
    datasets: {},
    pipeline: {},
  },
  loading: false,
  error: null,
};

function runStatusReducer(state = initialState, action) {
  switch (action.type) {
    case UPDATE_RUN_STATUS_DATA:
      return {
        ...state,
        ...action.data,
        error: null,
      };
    case SET_RUN_STATUS_LOADING:
      return {
        ...state,
        loading: action.loading,
      };
    case SET_RUN_STATUS_ERROR:
      return {
        ...state,
        error: action.error,
        loading: false,
      };
    default:
      return state;
  }
}

export default runStatusReducer;
