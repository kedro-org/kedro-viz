import { mockState } from '../utils/data.mock';
import {
  getActiveSnapshotNodes,
  getNodeDisabledTag,
  getNodeDisabledView,
  getNodeDisabled,
  getNodeActive,
  getNodes,
  getVisibleNodes
} from './nodes';
import {
  changeView,
  toggleNodeActive,
  toggleNodeDisabled,
  toggleTagFilter
} from '../actions';
import reducer from '../reducers';

describe('Selectors', () => {
  describe('getActiveSnapshotNodes', () => {
    it('retrieves a list of nodes for the active snapshot', () => {
      expect(getActiveSnapshotNodes(mockState)).toEqual(
        expect.arrayContaining([expect.any(String)])
      );
    });

    it('returns an empty array if snapshotNodes is empty', () => {
      const newMockState = Object.assign({}, mockState, { snapshotNodes: {} });
      expect(getActiveSnapshotNodes(newMockState)).toEqual([]);
    });

    it('returns an empty array if activeSnapshot is undefined', () => {
      const newMockState = Object.assign({}, mockState, {
        activeSnapshot: undefined
      });
      expect(getActiveSnapshotNodes(newMockState)).toEqual([]);
    });
  });

  describe('getNodeDisabledTag', () => {
    it('calculates whether nodes should be disabled based on their tags', () => {
      const nodeDisabled = getNodeDisabledTag(mockState);
      expect(nodeDisabled).toEqual(expect.any(Object));
      expect(Object.keys(nodeDisabled)).toEqual(
        expect.arrayContaining([expect.any(String)])
      );
      expect(Object.values(nodeDisabled)).toEqual(
        expect.arrayContaining([expect.any(Boolean)])
      );
    });

    it('does not disable a node if all tags are disabled', () => {
      const nodeDisabled = getNodeDisabledTag(mockState);
      expect(Object.values(nodeDisabled)).toEqual(
        Object.values(nodeDisabled).map(() => false)
      );
    });

    it('disables a node only if all of its tags are disabled', () => {
      const { nodeTags } = mockState;
      // Get list of task nodes from the active snapshot
      const taskNodes = getActiveSnapshotNodes(mockState).filter(
        id => mockState.nodeType[id] === 'task'
      );
      // Choose a node that has some tags (and which should be enabled)
      const enabledNodeID = taskNodes.find(id => nodeTags[id].length);
      // Choose a node that has no tags (and which should be disabled)
      const disabledNodeID = taskNodes.find(id => !nodeTags[id].length);
      const enabledNodeTags = nodeTags[enabledNodeID];
      // Update the state to enable one of the tags for that node
      const newMockState = reducer(
        mockState,
        toggleTagFilter(enabledNodeTags[0], true)
      );
      expect(getNodeDisabledTag(newMockState)[enabledNodeID]).toEqual(false);
      expect(getNodeDisabledTag(newMockState)[disabledNodeID]).toEqual(true);
    });
  });

  describe('getNodeDisabledView', () => {
    it('calculates whether nodes should be disabled based on the view', () => {
      const nodeDisabled = getNodeDisabledView(mockState);
      expect(nodeDisabled).toEqual(expect.any(Object));
      expect(Object.keys(nodeDisabled)).toEqual(
        expect.arrayContaining([expect.any(String)])
      );
      expect(Object.values(nodeDisabled)).toEqual(
        expect.arrayContaining([expect.any(Boolean)])
      );
    });

    it('shows all nodes when view is set to combined', () => {
      const newMockState = reducer(mockState, changeView('combined'));
      const nodeDisabled = getNodeDisabledView(newMockState);
      expect(Object.values(nodeDisabled)).toEqual(
        Object.values(nodeDisabled).map(() => false)
      );
    });

    it('disables only task nodes when view is set to data', () => {
      const newMockState = reducer(mockState, changeView('data'));
      const nodeDisabled = getNodeDisabledView(newMockState);
      const nodes = getActiveSnapshotNodes(newMockState);
      const { nodeType } = newMockState;
      const taskNodes = nodes.filter(id => nodeType[id] === 'task');
      const dataNodes = nodes.filter(id => nodeType[id] === 'data');
      expect(taskNodes.map(id => nodeDisabled[id])).toEqual(
        taskNodes.map(() => true)
      );
      expect(dataNodes.map(id => nodeDisabled[id])).toEqual(
        dataNodes.map(() => false)
      );
    });

    it('disables only data nodes when view is set to task', () => {
      const newMockState = reducer(mockState, changeView('task'));
      const nodeDisabled = getNodeDisabledView(newMockState);
      const nodes = getActiveSnapshotNodes(newMockState);
      const { nodeType } = newMockState;
      const taskNodes = nodes.filter(id => nodeType[id] === 'task');
      const dataNodes = nodes.filter(id => nodeType[id] === 'data');
      expect(taskNodes.map(id => nodeDisabled[id])).toEqual(
        taskNodes.map(() => false)
      );
      expect(dataNodes.map(id => nodeDisabled[id])).toEqual(
        dataNodes.map(() => true)
      );
    });
  });

  describe('getNodeDisabled', () => {
    it('returns whether a node is disabled', () => {
      const nodeDisabled = getNodeDisabled(mockState);
      expect(nodeDisabled).toEqual(expect.any(Object));
      expect(Object.keys(nodeDisabled)).toEqual(
        expect.arrayContaining([expect.any(String)])
      );
      expect(Object.values(nodeDisabled)).toEqual(
        Object.values(nodeDisabled).map(() => false)
      );
    });
  });

  describe('getNodeActive', () => {
    it('returns whether a node is active', () => {
      const nodeActive = getNodeActive(mockState);
      expect(nodeActive).toEqual(expect.any(Object));
      expect(Object.keys(nodeActive)).toEqual(
        expect.arrayContaining([expect.any(String)])
      );
      expect(Object.values(nodeActive)).toEqual(
        Object.values(nodeActive).map(() => false)
      );
    });

    it('returns true only when a given node is set to active', () => {
      const nodes = getActiveSnapshotNodes(mockState);
      const nodeID = nodes[0];
      const inactiveNodes = nodes.filter(id => id !== nodeID);
      const newMockState = reducer(mockState, toggleNodeActive(nodeID, true));
      const nodeActive = getNodeActive(newMockState);
      expect(nodeActive[nodeID]).toEqual(true);
      expect(inactiveNodes.every(id => nodeActive[id] === false)).toEqual(true);
    });
  });

  describe('getNodes', () => {
    it('returns formatted nodes as an array', () => {
      expect(getNodes(mockState)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            type: expect.stringMatching(/data|task/),
            active: expect.any(Boolean),
            disabled: expect.any(Boolean),
            disabled_node: expect.any(Boolean),
            disabled_tag: expect.any(Boolean),
            disabled_view: expect.any(Boolean)
          })
        ])
      );
    });

    it('returns nodes sorted by ID', () => {
      const nodeIDs = getNodes(mockState).map(d => d.id);
      const activeNodeIDs = getActiveSnapshotNodes(mockState).sort();
      expect(nodeIDs).toEqual(activeNodeIDs);
      expect(nodeIDs.reverse()).not.toEqual(activeNodeIDs);
    });
  });

  describe('getVisibleNodes', () => {
    it('returns visible nodes as an array', () => {
      const visibleNodes = getVisibleNodes(mockState);
      expect(getVisibleNodes(mockState)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            disabled: expect.any(Boolean)
          })
        ])
      );
    });

    it('returns only visible nodes', () => {
      const nodes = getActiveSnapshotNodes(mockState);
      const nodeID = nodes[0];
      const newMockState = reducer(mockState, toggleNodeDisabled(nodeID, true));
      const visibleNodeIDs = getVisibleNodes(newMockState).map(d => d.id);
      expect(visibleNodeIDs).toEqual(nodes.filter(id => id !== nodeID));
      expect(visibleNodeIDs.includes(nodeID)).toEqual(false);
    });
  });
});
