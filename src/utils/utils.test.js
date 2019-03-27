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
    const expectedTime = 'Wed Mar 27 2019 5:43:38 PM';

    it('returns a properly-formatted time from a numerical timestamp', () => {
      expect(formatTime(timestamp)).toEqual(expectedTime);
    });

    it('returns a properly-formatted time from a stringified timestamp', () => {
      expect(formatTime(timestamp + '')).toEqual(expectedTime);
    });
  });
});
