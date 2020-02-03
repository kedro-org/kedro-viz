import { mockState } from '../utils/state.mock';
import {
  getNodeDisabledTag,
  getNodeDisabledView,
  getNodeDisabled,
  getNodeActive,
  getNodeData,
  getNodeTextWidth,
  getPadding,
  getNodeSize,
  getVisibleNodes
} from './nodes';
import {
  changeView,
  toggleNodeClicked,
  toggleNodeHovered,
  toggleNodeDisabled,
  toggleTagFilter,
  toggleTextLabels
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

    it('returns true when a given node is clicked', () => {
      const nodes = getNodes(mockState.lorem);
      const nodeID = nodes[0];
      const inactiveNodes = nodes.filter(id => id !== nodeID);
      const newMockState = reducer(mockState.lorem, toggleNodeClicked(nodeID));
      const nodeActive = getNodeActive(newMockState);
      expect(nodeActive[nodeID]).toEqual(true);
      expect(inactiveNodes.every(id => nodeActive[id] === false)).toEqual(true);
    });

    it('returns true when a given node is hovered', () => {
      const nodes = getNodes(mockState.lorem);
      const nodeID = nodes[0];
      const inactiveNodes = nodes.filter(id => id !== nodeID);
      const newMockState = reducer(mockState.lorem, toggleNodeHovered(nodeID));
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

  describe('getNodeTextWidth', () => {
    it('returns an object whose values are all numbers', () => {
      expect(
        Object.values(getNodeTextWidth(mockState.lorem)).every(
          value => typeof value === 'number'
        )
      ).toBe(true);
    });

    it('returns width=0 if svg getBBox is not supported', () => {
      expect(
        Object.values(getNodeTextWidth(mockState.lorem)).every(
          value => value === 0
        )
      ).toBe(true);
    });
  });

  describe('getPadding', () => {
    it('returns an object with numerical x and y properties', () => {
      expect(getPadding()).toEqual(
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number)
        })
      );
    });

    it('returns x=16 & y=10 if text labels are enabled', () => {
      expect(getPadding(true, true).x).toBe(16);
      expect(getPadding(true, true).y).toBe(10);
      expect(getPadding(true, false).x).toBe(16);
      expect(getPadding(true, false).y).toBe(10);
    });

    it('returns identical x & y values if text labels are disabled', () => {
      expect(getPadding(false, true).x).toBe(getPadding(false, true).y);
      expect(getPadding(false, false).x).toBe(getPadding(false, false).y);
    });

    it('returns smaller padding values for task icons', () => {
      expect(getPadding(false, true).x).toBeLessThan(
        getPadding(false, false).x
      );
      expect(getPadding(false, true).y).toBeLessThan(
        getPadding(false, false).y
      );
    });
  });

  describe('getNodeSize', () => {
    it('returns an object containing objects with numerical properties', () => {
      expect(getNodeSize(mockState.lorem)).toEqual(expect.any(Object));
      expect(Object.values(getNodeSize(mockState.lorem))).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            width: expect.any(Number),
            height: expect.any(Number),
            textOffset: expect.any(Number),
            iconOffset: expect.any(Number),
            iconSize: expect.any(Number)
          })
        ])
      );
    });

    describe('when text labels are disabled', () => {
      const newMockState = reducer(mockState.lorem, toggleTextLabels(false));

      it('returns identical width and height', () => {
        const node0 = Object.values(getNodeSize(newMockState))[0];
        expect(node0.width).toBe(node0.height);
      });

      it('returns an iconOffset equal to iconSize/-2', () => {
        const node0 = Object.values(getNodeSize(newMockState))[0];
        expect(node0.iconOffset).toBe(node0.iconSize / -2);
      });
    });

    describe('when text labels are enabled', () => {
      const newMockState = reducer(mockState.lorem, toggleTextLabels(true));

      it('returns a width greater than the height', () => {
        const node0 = Object.values(getNodeSize(newMockState))[0];
        expect(node0.width).toBeGreaterThan(node0.height);
      });

      it('returns an iconOffset with a greater magnitude than iconSize / 2', () => {
        const node0 = Object.values(getNodeSize(newMockState))[0];
        expect(Math.abs(node0.iconOffset)).toBeGreaterThan(
          Math.abs(node0.iconSize / 2)
        );
      });
    });
  });

  describe('getVisibleNodes', () => {
    it('returns visible nodes as an array', () => {
      expect(getVisibleNodes(mockState.lorem)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            fullName: expect.any(String),
            label: expect.any(String),
            type: expect.any(String),
            width: expect.any(Number),
            height: expect.any(Number),
            textOffset: expect.any(Number),
            iconOffset: expect.any(Number),
            iconSize: expect.any(Number)
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
