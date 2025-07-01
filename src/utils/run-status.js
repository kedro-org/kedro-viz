import { localStorageLastRunEndTime } from '../config';

/**
 * Handle the latest run status by comparing end times
 * @param {string} endTime End time of the latest run
 * @returns {boolean} True if the latest run is newer than the last stored run
 */
export const handleLatestRunStatus = (endTime) => {
  const lastEndTime = localStorage.getItem(localStorageLastRunEndTime);

  // If no endTime available, assume it's not the latest run
  if (!endTime) {
    return false;
  }

  // If no previous run recorded, this is considered the latest
  if (!lastEndTime) {
    return true;
  }

  try {
    const currentRunTime = new Date(endTime).getTime();
    const lastRunTime = new Date(lastEndTime).getTime();

    // Return true if current run is newer than the last recorded run
    return currentRunTime > lastRunTime;
  } catch (error) {
    console.warn('Error comparing run timestamps:', error);
    // If there's an error parsing dates, assume it's not the latest run
    return false;
  }
};

/**
 * Reset the latest run status by clearing the last run end time from localStorage
 * @param {string} endTime End time of the latest run
 */
export function setLocalStorageLastRunEndTime(endTime) {
  localStorage.setItem(localStorageLastRunEndTime, endTime);
}
