import { isNewRun, setLocalStorageLastRunEndTime } from './run-status';
import { localStorageLastRunEndTime } from '../config';

describe('run-status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('isNewRun', () => {
    it('returns false when endTime is falsy', () => {
      expect(isNewRun()).toBe(false);
      expect(isNewRun('')).toBe(false);
      expect(isNewRun(null)).toBe(false);
    });

    it('returns true when no previous run is recorded', () => {
      const result = isNewRun('2023-01-01T10:00:00Z');
      expect(result).toBe(true);
    });

    it('returns true when current run is newer than last recorded run', () => {
      localStorage.setItem(localStorageLastRunEndTime, '2023-01-01T09:00:00Z');

      const result = isNewRun('2023-01-01T10:00:00Z');

      expect(result).toBe(true);
    });

    it('returns false when current run is older than last recorded run', () => {
      localStorage.setItem(localStorageLastRunEndTime, '2023-01-01T10:00:00Z');

      const result = isNewRun('2023-01-01T09:00:00Z');

      expect(result).toBe(false);
    });

    it('returns false when current run has same time as last recorded run', () => {
      const endTime = '2023-01-01T10:00:00Z';
      localStorage.setItem(localStorageLastRunEndTime, endTime);

      const result = isNewRun(endTime);

      expect(result).toBe(false);
    });
  });

  describe('setLocalStorageLastRunEndTime', () => {
    it('stores the endTime in localStorage', () => {
      const endTime = '2023-01-01T10:00:00Z';

      setLocalStorageLastRunEndTime(endTime);

      expect(localStorage.getItem(localStorageLastRunEndTime)).toBe(endTime);
    });

    it('stores falsy values correctly', () => {
      setLocalStorageLastRunEndTime(null);
      expect(localStorage.getItem(localStorageLastRunEndTime)).toBe('null');

      setLocalStorageLastRunEndTime('');
      expect(localStorage.getItem(localStorageLastRunEndTime)).toBe('');
    });
  });
});
