import {
  fetchRunStatus,
  processRunStatus,
} from '../utils/normalizeRunStatus.js';

export const UPDATE_RUN_STATUS_DATA = 'UPDATE_RUN_STATUS_DATA';

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
 * Load run status data
 * @returns {Function} Thunk that loads run status data
 */
export function loadRunStatusData() {
  return async function (dispatch) {
    const runData = await fetchRunStatus();
    const processedData = processRunStatus(runData);
    dispatch(updateRunStatusData(processedData));
  };
}
