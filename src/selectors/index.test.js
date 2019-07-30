import { mockState } from '../utils/state.mock';
import {
  getSnapshotHistory,
  getActiveSnapshotMessage,
  getActiveSnapshotTimestamp,
  getActiveSchema
} from './index';

describe('Selectors', () => {
  describe('getSnapshotHistory', () => {
    it('retrieves a list of snapshots used in the History tab', () => {
      expect(getSnapshotHistory(mockState)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            message: expect.any(String),
            timestamp: expect.any(Number)
          })
        ])
      );
    });
  });

  describe('getActiveSnapshotMessage', () => {
    it('retrieves the message for the active snapshot', () => {
      expect(getActiveSnapshotMessage(mockState)).toEqual(expect.any(String));
    });
  });

  describe('getActiveSnapshotTimestamp', () => {
    it('retrieves the timestamp for the active snapshot', () => {
      expect(getActiveSnapshotTimestamp(mockState)).toEqual(expect.any(Number));
    });
  });

  describe('getActiveSchema', () => {
    it('retrieves the raw unformatted data schema for the active snapshot', () => {
      const schema = getActiveSchema(mockState);
      expect(schema).toEqual(expect.any(String));
      expect(JSON.parse(schema)).toEqual(expect.any(Object));
    });
  });
});
