import { mockState } from '../utils/state.mock';
import {
  getNodeDisabledTag,
  getNodeDisabled,
  getEdgeDisabled
} from './disabled';
import { toggleNodesDisabled } from '../actions/nodes';
import { toggleTagFilter } from '../actions/tags';
import reducer from '../reducers';

const getNodeIDs = state => state.node.ids;
const getEdgeIDs = state => state.edge.ids;
const getEdgeSources = state => state.edge.sources;
const getEdgeTargets = state => state.edge.targets;
const getNodeTags = state => state.node.tags;
const getNodeType = state => state.node.type;

describe('Selectors', () => {
  describe('getNodeDisabledTag', () => {
    it('returns an object', () => {
      expect(getNodeDisabledTag(mockState.lorem)).toEqual(expect.any(Object));
    });

    it("returns an object whose keys match the current pipeline's nodes", () => {
      expect(Object.keys(getNodeDisabledTag(mockState.lorem))).toEqual(
        getNodeIDs(mockState.lorem)
      );
    });

    it('returns an object whose values are all Booleans', () => {
      expect(
        Object.values(getNodeDisabledTag(mockState.lorem)).every(
          value => typeof value === 'boolean'
        )
      ).toBe(true);
    });

    it('does not disable any nodes if all tags filters are inactive', () => {
      const nodeDisabled = getNodeDisabledTag(mockState.lorem);
      expect(Object.values(nodeDisabled)).toEqual(
        Object.values(nodeDisabled).map(() => false)
      );
    });

    it('disables a node with no tags if a tag filter is active', () => {
      const tag = mockState.animals.tag.ids[0];
      const nodeTags = getNodeTags(mockState.animals);
      // Choose a node that has no tags (and which should be disabled)
      const hasNoTags = id => !Boolean(nodeTags[id].length);
      const disabledNodeID = getNodeIDs(mockState.animals).find(hasNoTags);
      // Update the state to enable one of the tags for that node
      const newMockState = reducer(
        mockState.animals,
        toggleTagFilter(tag, true)
      );
      expect(getNodeDisabledTag(newMockState)[disabledNodeID]).toEqual(true);
    });

    it('does not disable a node if only one of its several tag filters are active', () => {
      const nodeTags = getNodeTags(mockState.animals);
      // Choose a node that has > 1 tag
      const enabledNodeID = getNodeIDs(mockState.animals).find(
        id => nodeTags[id].length > 1
      );
      // Update the state to enable one of the tags for that node
      const enabledNodeTags = nodeTags[enabledNodeID];
      const newMockState = reducer(
        mockState.animals,
        toggleTagFilter(enabledNodeTags[0], true)
      );
      expect(getNodeDisabledTag(newMockState)[enabledNodeID]).toEqual(false);
    });

    it('does not disable a node if all of its several tag filters are active', () => {
      const nodeTags = getNodeTags(mockState.animals);
      // Choose a node that has > 1 tag
      const enabledNodeID = getNodeIDs(mockState.animals).find(
        id => nodeTags[id].length > 1
      );
      // Update the state to activate all of the tag filters for that node
      const enabledNodeTags = nodeTags[enabledNodeID];
      const newMockState = enabledNodeTags.reduce(
        (state, tag) => reducer(state, toggleTagFilter(tag, true)),
        mockState.animals
      );
      expect(getNodeDisabledTag(newMockState)[enabledNodeID]).toEqual(false);
    });
  });

  describe('getNodeDisabled', () => {
    it('returns an object', () => {
      expect(getNodeDisabled(mockState.lorem)).toEqual(expect.any(Object));
    });

    it("returns an object whose keys match the current pipeline's nodes", () => {
      expect(Object.keys(getNodeDisabled(mockState.lorem))).toEqual(
        getNodeIDs(mockState.lorem)
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

  describe('getEdgeDisabled', () => {
    const nodeID = getNodeIDs(mockState.lorem)[0];
    const newMockState = reducer(
      mockState.lorem,
      toggleNodesDisabled([nodeID], true)
    );
    const edgeDisabled = getEdgeDisabled(newMockState);
    const edges = getEdgeIDs(newMockState);

    it('returns an object', () => {
      expect(getEdgeDisabled(mockState.lorem)).toEqual(expect.any(Object));
    });

    it("returns an object whose keys match the current pipeline's edges", () => {
      expect(Object.keys(getEdgeDisabled(mockState.lorem))).toEqual(
        getEdgeIDs(mockState.lorem)
      );
    });

    it('returns an object whose values are all Booleans', () => {
      expect(
        Object.values(getEdgeDisabled(mockState.lorem)).every(
          value => typeof value === 'boolean'
        )
      ).toBe(true);
    });

    it('does not disable an edge if no nodes are disabled', () => {
      const edgeDisabledValues = Object.values(
        getEdgeDisabled(mockState.lorem)
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
      expect(getEdgeDisabled(mockState.lorem)).toEqual(expect.any(Object));
    });

    it("returns an object whose keys match the current pipeline's edges", () => {
      expect(Object.keys(getEdgeDisabled(mockState.lorem))).toEqual(
        getEdgeIDs(mockState.lorem)
      );
    });

    it('returns an object whose values are all Booleans', () => {
      expect(
        Object.values(getEdgeDisabled(mockState.lorem)).every(
          value => typeof value === 'boolean'
        )
      ).toBe(true);
    });
  });
});
