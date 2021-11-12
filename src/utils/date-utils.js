import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
const _dayJs = dayjs.extend(relativeTime);

/**
 * Take a timestamp and return a meaningful length of time, e.g. 5 months ago
 * @param {ISO 8601 string} timestamp The timestamp to be converted
 * @returns A human-readable from-now date
 */
export const toHumanReadableTime = (timestamp) => {
  return _dayJs(timestamp).fromNow();
};
