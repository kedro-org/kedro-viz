import mockData from '../utils/data.mock';
import { mockState } from '../utils/state.mock';
import reducer from './index';
import * as action from '../actions';
import { getActiveSnapshotNodes } from '../selectors';
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
        snapshots: formatData({ snapshots: [mockData.snapshots[0]] })
      });
      expect(newState.snapshotIDs).toEqual([mockState.snapshotIDs[1]]);
      expect(newState.activeSnapshot).toBe(mockData.snapshots[0].schema_id);
      expect(Object.keys(newState.snapshotNodes)).toEqual([
        mockData.snapshots[0].schema_id
      ]);
    });
  });

  describe('TOGGLE_NODE_ACTIVE', () => {
    it('should toggle the given node active', () => {
      const newState = reducer(mockState, {
        type: action.TOGGLE_NODE_ACTIVE,
        nodeID: 'abc123',
        isActive: true
      });
      expect(newState.nodeActive).toEqual({ abc123: true });
    });
  });

  describe('TOGGLE_NODE_DISABLED', () => {
    it('should toggle the given node disabled', () => {
      const newState = reducer(mockState, {
        type: action.TOGGLE_NODE_DISABLED,
        nodeID: 'abc456',
        isDisabled: true
      });
      expect(newState.nodeDisabled).toEqual({ abc456: true });
    });
  });

  describe('TOGGLE_NODES_DISABLED', () => {
    it('should toggle the given nodes disabled', () => {
      const newState = reducer(mockState, {
        type: action.TOGGLE_NODES_DISABLED,
        nodeIDs: ['123', 'abc'],
        isDisabled: true
      });
      expect(newState.nodeDisabled).toEqual({ '123': true, abc: true });
    });
  });

  describe('TOGGLE_PARAMETERS', () => {
    const newState = reducer(mockState, {
      type: action.TOGGLE_PARAMETERS,
      parameters: false
    });
    const { nodeDisabled, nodeIsParam } = newState;
    const activeSnapshotNodes = getActiveSnapshotNodes(newState);

    it('should disable any nodes where is_parameters is true', () => {
      const paramNodes = activeSnapshotNodes.filter(node => nodeIsParam[node]);
      expect(paramNodes.every(key => nodeDisabled[key])).toBe(true);
    });

    it('should not disable any nodes where is_parameters is false', () => {
      const nonParamNodes = activeSnapshotNodes.filter(
        node => !nodeIsParam[node]
      );
      expect(nonParamNodes.every(key => !nodeDisabled[key])).toBe(true);
    });
  });

  describe('TOGGLE_TEXT_LABELS', () => {
    it('should toggle the value of textLabels', () => {
      const newState = reducer(mockState, {
        type: action.TOGGLE_TEXT_LABELS,
        textLabels: true
      });
      expect(mockState.textLabels).toBe(false);
      expect(newState.textLabels).toBe(true);
    });
  });

  describe('TOGGLE_TAG_ACTIVE', () => {
    it('should toggle the given tag active', () => {
      const newState = reducer(mockState, {
        type: action.TOGGLE_TAG_ACTIVE,
        tagID: 'huge',
        active: true
      });
      expect(newState.tagActive).toEqual({ huge: true });
    });
  });

  describe('TOGGLE_TAG_FILTER', () => {
    it('should disable a given tag', () => {
      const newState = reducer(mockState, {
        type: action.TOGGLE_TAG_FILTER,
        tagID: 'small',
        enabled: true
      });
      expect(newState.tagEnabled).toEqual({ small: true });
    });
  });

  describe('TOGGLE_THEME', () => {
    it('should toggle the theme to light', () => {
      const newState = reducer(mockState, {
        type: action.TOGGLE_THEME,
        theme: 'light'
      });
      expect(newState.theme).toBe('light');
    });
  });

  describe('UPDATE_CHART_SIZE', () => {
    it("should update the chart's dimensions", () => {
      const newState = reducer(mockState, {
        type: action.UPDATE_CHART_SIZE,
        chartSize: document.body.getBoundingClientRect()
      });
      expect(newState.chartSize).toEqual({
        bottom: expect.any(Number),
        height: expect.any(Number),
        left: expect.any(Number),
        right: expect.any(Number),
        top: expect.any(Number),
        width: expect.any(Number)
      });
    });
  });
});
