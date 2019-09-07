import { mockState } from '../utils/state.mock';
import {
  getNodeDisabledTag,
  getNodeDisabledView,
  getNodeDisabled,
  getNodeActive,
  getNodeData,
  getVisibleNodes
} from './nodes';
import {
  changeView,
  toggleNodeActive,
  toggleNodeDisabled,
  toggleTagFilter
} from '../actions';
import reducer from '../reducers';

const getNodes = state => state.nodes;

describe('Selectors', () => {
  describe('getNodeDisabledTag', () => {
    it('returns an object', () => {
      expect(getNodeDisabledTag(mockState.lorem)).toEqual(expect.any(Object));
    });

    it("returns an object whose keys match the current pipeline's nodes", () => {
      expect(Object.keys(getNodeDisabledTag(mockState.lorem))).toEqual(
        getNodes(mockState.lorem)
      );
    });

    it('returns an object whose values are all Booleans', () => {
      expect(
        Object.values(getNodeDisabledTag(mockState.lorem)).every(
          value => typeof value === 'boolean'
        )
      ).toBe(true);
    });

    it('does not disable a node if all tags are disabled', () => {
      const nodeDisabled = getNodeDisabledTag(mockState.lorem);
      expect(Object.values(nodeDisabled)).toEqual(
        Object.values(nodeDisabled).map(() => false)
      );
    });

    it('disables a node only if all of its tags are disabled', () => {
      const { nodeTags } = mockState.animals;
      // Get list of task nodes from the current pipeline
      const taskNodes = getNodes(mockState.animals).filter(
        id => mockState.animals.nodeType[id] === 'task'
      );
      // Choose a node that has some tags (and which should be enabled)
      const hasTags = id => Boolean(nodeTags[id].length);
      const enabledNodeID = taskNodes.find(hasTags);
      // Choose a node that has no tags (and which should be disabled)
      const hasNoTags = id => !Boolean(nodeTags[id].length);
      const disabledNodeID = taskNodes.find(hasNoTags);
      // Update the state to enable one of the tags for that node
      const enabledNodeTags = nodeTags[enabledNodeID];
      const newMockState = reducer(
        mockState.animals,
        toggleTagFilter(enabledNodeTags[0], true)
      );
      expect(getNodeDisabledTag(newMockState)[enabledNodeID]).toEqual(false);
      expect(getNodeDisabledTag(newMockState)[disabledNodeID]).toEqual(true);
    });
  });

  describe('getNodeDisabledView', () => {
    it('returns an object', () => {
      expect(getNodeDisabledView(mockState.lorem)).toEqual(expect.any(Object));
    });

    it("returns an object whose keys match the current pipeline's nodes", () => {
      expect(Object.keys(getNodeDisabledView(mockState.lorem))).toEqual(
        getNodes(mockState.lorem)
      );
    });

    it('returns an object whose values are all Booleans', () => {
      expect(
        Object.values(getNodeDisabledView(mockState.lorem)).every(
          value => typeof value === 'boolean'
        )
      ).toBe(true);
    });

    it('shows all nodes when view is set to combined', () => {
      const newMockState = reducer(mockState.lorem, changeView('combined'));
      const nodeDisabled = getNodeDisabledView(newMockState);
      expect(Object.values(nodeDisabled)).toEqual(
        Object.values(nodeDisabled).map(() => false)
      );
    });

    it('disables only task nodes when view is set to data', () => {
      const newMockState = reducer(mockState.lorem, changeView('data'));
      const nodeDisabled = getNodeDisabledView(newMockState);
      const nodes = getNodes(newMockState);
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
      const newMockState = reducer(mockState.lorem, changeView('task'));
      const nodeDisabled = getNodeDisabledView(newMockState);
      const nodes = getNodes(newMockState);
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
    it('returns an object', () => {
      expect(getNodeDisabled(mockState.lorem)).toEqual(expect.any(Object));
    });

    it("returns an object whose keys match the current pipeline's nodes", () => {
      expect(Object.keys(getNodeDisabled(mockState.lorem))).toEqual(
        getNodes(mockState.lorem)
      );
    });

    it('returns an object whose values are all Booleans', () => {
      expect(
        Object.values(getNodeDisabled(mockState.lorem)).every(
          value => typeof value === 'boolean'
        )
      ).toBe(true);
    });
  });

  describe('getNodeActive', () => {
    it('returns an object', () => {
      expect(getNodeActive(mockState.lorem)).toEqual(expect.any(Object));
    });

    it("returns an object whose keys match the current pipeline's nodes", () => {
      expect(Object.keys(getNodeActive(mockState.lorem))).toEqual(
        getNodes(mockState.lorem)
      );
    });

    it('returns an object whose values are all Booleans', () => {
      expect(
        Object.values(getNodeActive(mockState.lorem)).every(
          value => typeof value === 'boolean'
        )
      ).toBe(true);
    });

    it('returns true only when a given node is set to active', () => {
      const nodes = getNodes(mockState.lorem);
      const nodeID = nodes[0];
      const inactiveNodes = nodes.filter(id => id !== nodeID);
      const newMockState = reducer(
        mockState.lorem,
        toggleNodeActive(nodeID, true)
      );
      const nodeActive = getNodeActive(newMockState);
      expect(nodeActive[nodeID]).toEqual(true);
      expect(inactiveNodes.every(id => nodeActive[id] === false)).toEqual(true);
    });
  });

  describe('getNodeData', () => {
    it('returns formatted nodes as an array', () => {
      expect(getNodeData(mockState.lorem)).toEqual(
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

    it('returns nodes sorted by name', () => {
      const { nodeName } = mockState.lorem;
      const nodeIDs = getNodeData(mockState.lorem).map(d => d.id);
      const activeNodeIDs = getNodes(mockState.lorem).sort((a, b) => {
        if (nodeName[a] < nodeName[b]) return -1;
        if (nodeName[a] > nodeName[b]) return 1;
        return 0;
      });
      expect(nodeIDs).toEqual(activeNodeIDs);
    });
  });

  describe('getVisibleNodes', () => {
    it('returns visible nodes as an array', () => {
      expect(getVisibleNodes(mockState.lorem)).toEqual(
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
      const nodes = getNodes(mockState.lorem);
      const nodeID = nodes[0];
      const newMockState = reducer(
        mockState.lorem,
        toggleNodeDisabled(nodeID, true)
      );
      const visibleNodeIDs = getVisibleNodes(newMockState).map(d => d.id);
      expect(visibleNodeIDs).toEqual(nodes.filter(id => id !== nodeID));
      expect(visibleNodeIDs.includes(nodeID)).toEqual(false);
    });
  });
});
