import mockData from '../utils/data.mock';
import {
  CHANGE_ACTIVE_SNAPSHOT,
  CHANGE_VIEW,
  DELETE_SNAPSHOT,
  RESET_SNAPSHOT_DATA,
  TOGGLE_NODE_ACTIVE,
  TOGGLE_NODE_DISABLED,
  TOGGLE_NODES_DISABLED,
  TOGGLE_PARAMETERS,
  TOGGLE_TAG_ACTIVE,
  TOGGLE_TAG_FILTER,
  TOGGLE_THEME,
  TOGGLE_TEXT_LABELS,
  UPDATE_CHART_SIZE,
  changeActiveSnapshot,
  changeView,
  deleteSnapshot,
  resetSnapshotData,
  toggleNodeActive,
  toggleNodeDisabled,
  toggleNodesDisabled,
  toggleParameters,
  toggleTextLabels,
  toggleTagActive,
  toggleTheme,
  toggleTagFilter,
  updateChartSize
} from '../actions';

describe('actions', () => {
  it('should create an action to change the active snapshot', () => {
    const snapshotID = '1234567890';
    const expectedAction = {
      type: CHANGE_ACTIVE_SNAPSHOT,
      snapshotID
    };
    expect(changeActiveSnapshot(snapshotID)).toEqual(expectedAction);
  });

  it('should create an action to change the view', () => {
    const view = 'combined';
    const expectedAction = {
      type: CHANGE_VIEW,
      view
    };
    expect(changeView(view)).toEqual(expectedAction);
  });

  it('should create an action to delete a snapshot', () => {
    const id = '123567890';
    const expectedAction = {
      type: DELETE_SNAPSHOT,
      id
    };
    expect(deleteSnapshot(id)).toEqual(expectedAction);
  });

  it('should create an action to reset snapshot data', () => {
    const snapshots = mockData;
    const expectedAction = {
      type: RESET_SNAPSHOT_DATA,
      snapshots
    };
    expect(resetSnapshotData(snapshots)).toEqual(expectedAction);
  });

  it('should create an action to toggle whether a node is active', () => {
    const nodeID = '12367890';
    const isActive = false;
    const expectedAction = {
      type: TOGGLE_NODE_ACTIVE,
      nodeID,
      isActive
    };
    expect(toggleNodeActive(nodeID, isActive)).toEqual(expectedAction);
  });

  it('should create an action to toggle whether a node is disabled', () => {
    const nodeID = '12367890';
    const isDisabled = true;
    const expectedAction = {
      type: TOGGLE_NODE_DISABLED,
      nodeID,
      isDisabled
    };
    expect(toggleNodeDisabled(nodeID, isDisabled)).toEqual(expectedAction);
  });

  it('should create an action to toggle whether somes nodes are disabled', () => {
    const nodeIDs = ['12367890', '0987654321', 'qwertyuiop'];
    const isDisabled = false;
    const expectedAction = {
      type: TOGGLE_NODES_DISABLED,
      nodeIDs,
      isDisabled
    };
    expect(toggleNodesDisabled(nodeIDs, isDisabled)).toEqual(expectedAction);
  });

  it('should create an action to toggle whether to show Parameters on/off', () => {
    const parameters = false;
    const expectedAction = {
      type: TOGGLE_PARAMETERS,
      parameters
    };
    expect(toggleParameters(parameters)).toEqual(expectedAction);
  });

  it('should create an action to toggle whether to show text labels on/off', () => {
    const textLabels = false;
    const expectedAction = {
      type: TOGGLE_TEXT_LABELS,
      textLabels
    };
    expect(toggleTextLabels(textLabels)).toEqual(expectedAction);
  });

  it("should create an action to toggle a tag's active state on/off", () => {
    const tagID = '1234567890';
    const active = false;
    const expectedAction = {
      type: TOGGLE_TAG_ACTIVE,
      tagID,
      active
    };
    expect(toggleTagActive(tagID, active)).toEqual(expectedAction);
  });

  it('should create an action to toggle a tag on/off', () => {
    const tagID = '1234567890';
    const enabled = false;
    const expectedAction = {
      type: TOGGLE_TAG_FILTER,
      tagID,
      enabled
    };
    expect(toggleTagFilter(tagID, enabled)).toEqual(expectedAction);
  });

  it('should create an action to toggle the theme', () => {
    const theme = 'light';
    const expectedAction = {
      type: TOGGLE_THEME,
      theme
    };
    expect(toggleTheme(theme)).toEqual(expectedAction);
  });

  it('should create an action to update the chart size', () => {
    const chartSize = {
      x: 10,
      y: 20,
      outerWidth: 30,
      outerHeight: 40,
      width: 50,
      height: 60,
      navOffset: 70
    };
    const expectedAction = {
      type: UPDATE_CHART_SIZE,
      chartSize
    };
    expect(updateChartSize(chartSize)).toEqual(expectedAction);
  });
});
