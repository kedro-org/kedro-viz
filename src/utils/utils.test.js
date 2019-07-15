import {
  arrayToObject,
  formatTime,
  getNumberArray,
  randomIndex,
  randomNumber,
  getRandom,
  getRandomName,
  unique
} from './index';

describe('utils', () => {
  describe('arrayToObject', () => {
    it('returns an empty object when given an empty array', () => {
      expect(arrayToObject([], () => {})).toEqual({});
    });

    it('returns an object with properties', () => {
      const callback = foo =>
        foo
          .split('')
          .reverse()
          .join('');
      expect(arrayToObject(['foo'], callback)).toEqual({ foo: 'oof' });
    });
  });

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

  describe('getNumberArray', () => {
    it('returns an array of numbers with length equal to the input value', () => {
      expect(getNumberArray(10)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
  });

  describe('randomIndex', () => {
    it('returns a number', () => {
      expect(typeof randomIndex(5)).toEqual('number');
    });

    it('returns an integer', () => {
      const n = randomIndex(500);
      expect(Math.round(n)).toEqual(n);
    });

    it('returns a number less than the number passed', () => {
      const n = 10;
      expect(randomIndex(n)).toBeLessThan(n);
    });
  });

  describe('randomNumber', () => {
    it('returns a number', () => {
      expect(typeof randomNumber(5)).toEqual('number');
    });

    it('returns an integer', () => {
      const n = randomNumber(500);
      expect(Math.round(n)).toEqual(n);
    });

    it('returns a number less or equal to the number passed', () => {
      const n = 10;
      expect(randomNumber(n)).toBeLessThan(n + 1);
    });

    it('returns a number greater than zero', () => {
      expect(randomNumber(2)).toBeGreaterThan(0);
    });
  });

  describe('getRandom', () => {
    it('gets a random number from an array', () => {
      const arr = getNumberArray(10);
      expect(arr).toContain(getRandom(arr));
    });

    it('gets a random string from an array', () => {
      const arr = getNumberArray(20).map(String);
      expect(arr).toContain(getRandom(arr));
    });
  });

  describe('getRandomName', () => {
    it('returns a string', () => {
      expect(typeof getRandomName(10)).toEqual('string');
    });

    it('returns the right number of underscore-separated words', () => {
      expect(getRandomName(10).split('_')).toHaveLength(10);
    });

    it('returns the right number of space-separated words', () => {
      expect(getRandomName(50, ' ').split(' ')).toHaveLength(50);
    });
  });

  describe('unique', () => {
    it('removes duplicates from an array', () => {
      expect([1, 1, 2, 2, 3, 3, 1].filter(unique)).toEqual([1, 2, 3]);
    });
  });
});
