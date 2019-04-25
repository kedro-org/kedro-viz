// import { toggleTagFilter } from '../actions';
import { mockData, mockState } from '../utils/data.mock';
import reducer from './index';
import * as action from '../actions';
import { getInitialState } from '../components/app/load-data';
import formatData from '../utils/format-data';

describe('Reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {})).toEqual({});
  });

  describe('CHANGE_ACTIVE_SNAPSHOT', () => {
    it('should change the active snapshot when the initial state is unset', () => {
      expect(
        reducer(
          {},
          {
            type: action.CHANGE_ACTIVE_SNAPSHOT,
            snapshotID: '123'
          }
        )
      ).toEqual({
        activeSnapshot: '123'
      });
    });

    it('should change the active snapshot when the full state is supplied', () => {
      expect(
        reducer(mockState, {
          type: action.CHANGE_ACTIVE_SNAPSHOT,
          snapshotID: '0987654321'
        })
      ).toEqual(
        Object.assign({}, mockState, {
          activeSnapshot: '0987654321'
        })
      );
    });
  });

  describe('CHANGE_VIEW', () => {
    it('should change the view', () => {
      expect(
        reducer(
          { view: 'combined' },
          {
            type: action.CHANGE_VIEW,
            view: 'data'
          }
        )
      ).toEqual({ view: 'data' });
    });
  });

  describe('DELETE_SNAPSHOT', () => {
    it('should return the original state when snapshot ID is not found', () => {
      expect(
        reducer(mockState, {
          type: action.DELETE_SNAPSHOT,
          snapshotID: 'qwertyuiop'
        })
      ).toEqual(mockState);
    });

    it('should run state.onDeleteSnapshot if available', () => {
      const state = {
        onDeleteSnapshot: jest.fn()
      };
      expect(state.onDeleteSnapshot.mock.calls.length).toBe(0);
      expect(
        reducer(state, {
          type: action.DELETE_SNAPSHOT,
          snapshotID: 'qwertyuiop'
        })
      ).toEqual(state);
      expect(state.onDeleteSnapshot.mock.calls.length).toBe(1);
    });

    it('should delete one of the snapshots if state.onDeleteSnapshot does not exist', () => {
      const snapshotID = mockState.snapshotIDs[0];
      const newState = reducer(mockState, {
        type: action.DELETE_SNAPSHOT,
        id: snapshotID
      });
      expect(newState.snapshotIDs).toEqual(
        mockState.snapshotIDs.filter(id => id !== snapshotID)
      );
      expect(newState.snapshotIDs.length).toBe(
        mockState.snapshotIDs.length - 1
      );
    });
  });

  describe('RESET_SNAPSHOT_DATA', () => {
    it('should return the same snapshot data when given the same input', () => {
      expect(
        reducer(mockState, {
          type: action.RESET_SNAPSHOT_DATA,
          snapshots: formatData(mockData)
        })
      ).toEqual(mockState);
    });

    it('should reset the snapshots', () => {
      const newState = reducer(mockState, {
        type: action.RESET_SNAPSHOT_DATA,
        snapshots: formatData([mockData[0]])
      });
      expect(newState.snapshotIDs).toEqual([mockState.snapshotIDs[1]]);
      expect(newState.activeSnapshot).toBe(mockData[0].kernel_ai_schema_id);
      expect(Object.keys(newState.snapshotNodes)).toEqual([
        mockData[0].kernel_ai_schema_id
      ]);
    });
  });
});
