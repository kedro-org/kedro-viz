import { fetchRunEvents, processRunEvents } from '../utils/run-status';

export const UPDATE_RUN_STATUS_DATA = 'UPDATE_RUN_STATUS_DATA';
export const SET_RUN_STATUS_LOADING = 'SET_RUN_STATUS_LOADING';
export const SET_RUN_STATUS_ERROR = 'SET_RUN_STATUS_ERROR';

/**
 * Update run status data
 * @param {Object} data Run status data
 */
export function updateRunStatusData(data) {
  return {
    type: UPDATE_RUN_STATUS_DATA,
    data,
  };
}

/**
 * Set run status loading state
 * @param {Boolean} loading Whether data is loading
 */
export function setRunStatusLoading(loading) {
  return {
    type: SET_RUN_STATUS_LOADING,
    loading,
  };
}

/**
 * Set run status error
 * @param {String} error Error message
 */
export function setRunStatusError(error) {
  return {
    type: SET_RUN_STATUS_ERROR,
    error,
  };
}

/**
 * Load run status data
 * @returns {Function} Thunk that loads run status data
 */
export function loadRunStatusData() {
  return async function (dispatch) {
    dispatch(setRunStatusLoading(true));
    try {
      const events = await fetchRunEvents();
      const processedData = processRunEvents(events);
      dispatch(updateRunStatusData(processedData));
      dispatch(setRunStatusLoading(false));
    } catch (error) {
      dispatch(setRunStatusError(error.message));
      dispatch(setRunStatusLoading(false));
    }
  };
}
