import {
  arrayToObject,
  formatTime,
  getNumberArray,
  randomIndex,
  randomNumber,
  getRandom,
  getRandomMatch,
  getRandomName,
  unique
} from './index';

describe('utils', () => {
  describe('formatTime', () => {
    const timestamp = 1553708618164;
    const date = new Date(timestamp);

    it('returns a properly-formatted date from a numerical timestamp', () => {
      expect(formatTime(timestamp)).toEqual(
        expect.stringContaining(date.toDateString())
      );
    });

    it('returns a properly-formatted time from a numerical timestamp', () => {
      expect(formatTime(timestamp)).toEqual(
        expect.stringContaining(date.toLocaleTimeString())
      );
    });

    it('returns a properly-formatted date from a stringified timestamp', () => {
      expect(formatTime(String(timestamp))).toEqual(
        expect.stringContaining(date.toDateString())
      );
    });

    it('returns a properly-formatted time from a stringified timestamp', () => {
      expect(formatTime(String(timestamp))).toEqual(
        expect.stringContaining(date.toLocaleTimeString())
      );
    });
  });
});
