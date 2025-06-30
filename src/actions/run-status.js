import { processRunStatus } from '../store/normalize-run-data';

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
 * Fetch pipeline run status from the API endpoint
 * @returns {Promise<Object>} Pipeline run status in structured format
 */
export const fetchRunStatus = async () => {
  try {
    const response = await fetch(`/api/run-status`);
    if (!response.ok) {
      throw new Error(`Error fetching run status: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to load run status:', error);
    return { nodes: {}, datasets: {}, pipeline: {} };
  }
};

/**
 * Load run status data on initial page-load
 * @returns {Function} Thunk that loads run status data
 */
export function loadInitialRunStatusData() {
  return async function (dispatch) {
    const runData = await fetchRunStatus();
    const processedData = processRunStatus(runData);
    dispatch(updateRunStatusData(processedData));
  };
}
