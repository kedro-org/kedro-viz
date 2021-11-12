import * as dayjs from 'dayjs';
import * as relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

/**
 * Take a timestamp and return a meaningful length of time, e.g. 5 months ago
 * @param {ISO 8601 string} timestamp The timestamp to be converted
 * @returns A human-readable from-now date
 */
export const toHumanReadableTime = (timestamp) => {
  return dayjs(timestamp).fromNow();
};
