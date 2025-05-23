import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
const _dayJs = dayjs.extend(relativeTime);

export const formatTimestamp = (timestamp) =>
  timestamp.replace('.', ':').replace('.', ':');

/**
 * Take a timestamp and return a meaningful length of time, e.g. 5 months ago
 * Kedro uses this format VERSION_FORMAT = "%Y-%m-%dT%H.%M.%S.%fZ"
 * So we need to do some string manipulation to get it to this formatted
 * version: 2021-11-08T18:31:01.171Z
 * @param {String} timestamp The timestamp to be converted
 * @returns A human-readable from-now date
 */
export const toHumanReadableTime = (timestamp) => {
  return _dayJs(formatTimestamp(timestamp)).fromNow();
};
