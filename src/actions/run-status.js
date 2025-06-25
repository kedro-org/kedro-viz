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
