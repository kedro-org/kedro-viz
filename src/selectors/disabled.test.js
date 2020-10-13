import { mockState } from '../utils/state.mock';
import {
  getNodeDisabledTag,
  getNodeDisabled,
  getEdgeDisabled,
  getVisibleNodeIDs,
  getVisibleLayerIDs
} from './disabled';
import { toggleNodesDisabled } from '../actions/nodes';
import { toggleLayers } from '../actions';
import { toggleTagFilter } from '../actions/tags';
import reducer from '../reducers';

const getNodeIDs = state => state.node.ids;
const getEdgeIDs = state => state.edge.ids;
const getEdgeSources = state => state.edge.sources;
const getEdgeTargets = state => state.edge.targets;
const getNodeTags = state => state.node.tags;

describe('Selectors', () => {
  describe('getNodeDisabledTag', () => {
    it("returns an object whose keys match the current pipeline's nodes", () => {
      expect(Object.keys(getNodeDisabledTag(mockState.testData))).toEqual(
        getNodeIDs(mockState.testData)
      );
    });

    it('returns an object whose values are all Booleans', () => {
      expect(
        Object.values(getNodeDisabledTag(mockState.testData)).every(
          value => typeof value === 'boolean'
        )
      ).toBe(true);
    });

    it('does not disable any nodes if all tags filters are inactive', () => {
      const nodeDisabled = getNodeDisabledTag(mockState.testData);
      expect(Object.values(nodeDisabled)).toEqual(
        Object.values(nodeDisabled).map(() => false)
      );
    });

    it('disables a node with no tags if a tag filter is active', () => {
      const tag = mockState.testData.tag.ids[0];
      const nodeTags = getNodeTags(mockState.testData);
      // Choose a node that has no tags (and which should be disabled)
      const hasNoTags = id => !Boolean(nodeTags[id].length);
      const disabledNodeID = getNodeIDs(mockState.testData).find(hasNoTags);
      // Update the state to enable one of the tags for that node
      const newMockState = reducer(
        mockState.testData,
        toggleTagFilter(tag, true)
      );
      expect(getNodeDisabledTag(newMockState)[disabledNodeID]).toEqual(true);
    });

    it('does not disable a node if only one of its several tag filters are active', () => {
      const nodeTags = getNodeTags(mockState.testData);
      // Choose a node that has > 1 tag
      const enabledNodeID = getNodeIDs(mockState.testData).find(
        id => nodeTags[id].length > 1
      );
      // Update the state to enable one of the tags for that node
      const enabledNodeTags = nodeTags[enabledNodeID];
      const newMockState = reducer(
        mockState.testData,
        toggleTagFilter(enabledNodeTags[0], true)
      );
      expect(getNodeDisabledTag(newMockState)[enabledNodeID]).toEqual(false);
    });

    it('does not disable a node if all of its several tag filters are active', () => {
      const nodeTags = getNodeTags(mockState.testData);
      // Choose a node that has > 1 tag
      const enabledNodeID = getNodeIDs(mockState.testData).find(
        id => nodeTags[id].length > 1
      );
      // Update the state to activate all of the tag filters for that node
      const enabledNodeTags = nodeTags[enabledNodeID];
      const newMockState = enabledNodeTags.reduce(
        (state, tag) => reducer(state, toggleTagFilter(tag, true)),
        mockState.testData
      );
      expect(getNodeDisabledTag(newMockState)[enabledNodeID]).toEqual(false);
    });
  });

  describe('getNodeDisabled', () => {
    it('returns an object', () => {
      expect(getNodeDisabled(mockState.testData)).toEqual(expect.any(Object));
    });

    it("returns an object whose keys match the current pipeline's nodes", () => {
      expect(Object.keys(getNodeDisabled(mockState.testData))).toEqual(
        getNodeIDs(mockState.testData)
      );
    });

    it('returns an object whose values are all Booleans', () => {
      expect(
        Object.values(getNodeDisabled(mockState.testData)).every(
          value => typeof value === 'boolean'
        )
      ).toBe(true);
    });
  });

  describe('getEdgeDisabled', () => {
    const nodeID = getNodeIDs(mockState.testData)[0];
    const newMockState = reducer(
      mockState.testData,
      toggleNodesDisabled([nodeID], true)
    );
    const edgeDisabled = getEdgeDisabled(newMockState);
    const edges = getEdgeIDs(newMockState);

    it('returns an object', () => {
      expect(getEdgeDisabled(mockState.testData)).toEqual(expect.any(Object));
    });

    it("returns an object whose keys match the current pipeline's edges", () => {
      expect(Object.keys(getEdgeDisabled(mockState.testData))).toEqual(
        getEdgeIDs(mockState.testData)
      );
    });

    it('returns an object whose values are all Booleans', () => {
      expect(
        Object.values(getEdgeDisabled(mockState.testData)).every(
          value => typeof value === 'boolean'
        )
      ).toBe(true);
    });

    it('does not disable an edge if no nodes are disabled', () => {
      const edgeDisabledValues = Object.values(
        getEdgeDisabled(mockState.testData)
      );
      expect(edgeDisabledValues).toEqual(edgeDisabledValues.map(() => false));
    });

    it('disables an edge if one of its nodes is disabled', () => {
      const disabledEdges = Object.keys(edgeDisabled).filter(
        id => edgeDisabled[id]
      );
      const disabledEdgesMock = edges.filter(
        id =>
          getEdgeSources(newMockState)[id] === nodeID ||
          getEdgeTargets(newMockState)[id] === nodeID
      );
      expect(disabledEdges).toEqual(disabledEdgesMock);
    });

    it('does not disable an edge if none of its nodes are disabled', () => {
      const enabledEdges = Object.keys(edgeDisabled).filter(
        id => !edgeDisabled[id]
      );
      const enabledEdgesMock = edges.filter(
        id =>
          getEdgeSources(newMockState)[id] !== nodeID &&
          getEdgeTargets(newMockState)[id] !== nodeID
      );
      expect(enabledEdges).toEqual(enabledEdgesMock);
    });

    it('returns an object', () => {
      expect(getEdgeDisabled(mockState.testData)).toEqual(expect.any(Object));
    });

    it("returns an object whose keys match the current pipeline's edges", () => {
      expect(Object.keys(getEdgeDisabled(mockState.testData))).toEqual(
        getEdgeIDs(mockState.testData)
      );
    });

    it('returns an object whose values are all Booleans', () => {
      expect(
        Object.values(getEdgeDisabled(mockState.testData)).every(
          value => typeof value === 'boolean'
        )
      ).toBe(true);
    });
  });

  describe('getVisibleNodeIDs', () => {
    it('returns an array of node IDs', () => {
      expect(getVisibleNodeIDs(mockState.testData)).toEqual(
        mockState.testData.node.ids
      );
    });
  });

  describe('getVisibleLayerIDs', () => {
    it('returns an array of layer IDs', () => {
      expect(getVisibleLayerIDs(mockState.testData)).toEqual(
        mockState.testData.layer.ids
      );
    });

    it('returns an empty array if layers are disabled', () => {
      const newMockState = reducer(mockState.testData, toggleLayers(false));
      expect(getVisibleLayerIDs(newMockState)).toEqual([]);
    });

    it('returns an empty array if there are no layers', () => {
      const newMockState = {
        ...mockState.testData,
        layer: {
          ids: [],
          visible: true
        }
      };
      expect(getVisibleLayerIDs(newMockState)).toEqual([]);
    });
  });
});
