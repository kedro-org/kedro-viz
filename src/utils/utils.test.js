import { arrayToObject, unique } from './index';

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

  describe('unique', () => {
    it('removes duplicates from an array', () => {
      expect([1, 1, 2, 2, 3, 3, 1].filter(unique)).toEqual([1, 2, 3]);
    });
  });
});
