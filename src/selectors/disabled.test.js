import { prepareState } from '../utils/state.mock';
import spaceflights from '../utils/data/spaceflights.mock.json';
import { toggleModularPipelineExpanded } from '../actions/modular-pipelines';
import {
  getNodeDisabledTag,
  getNodeDisabled,
  getEdgeDisabled,
  getVisibleLayerIDs,
} from './disabled';
import { toggleLayers } from '../actions';
import { toggleTagFilter } from '../actions/tags';
import reducer from '../reducers';

const getNodeIDs = (state) => state.node.ids;
const getEdgeIDs = (state) => state.edge.ids;
const getNodeTags = (state) => state.node.tags;

describe('Selectors', () => {
  const mockState = prepareState({
    data: spaceflights,
    beforeLayoutActions: [
      () => toggleModularPipelineExpanded(['data_science', 'data_processing']),
    ],
  });

  describe('getNodeDisabledTag', () => {
    it("returns an object whose keys match the current pipeline's nodes", () => {
      expect(Object.keys(getNodeDisabledTag(mockState))).toEqual(
        getNodeIDs(mockState)
      );
    });

    it('returns an object whose values are all Booleans', () => {
      expect(
        Object.values(getNodeDisabledTag(mockState)).every(
          (value) => typeof value === 'boolean'
        )
      ).toBe(true);
    });

    it('does not disable any nodes if all tags filters are inactive', () => {
      const nodeDisabled = getNodeDisabledTag(mockState);
      expect(Object.values(nodeDisabled)).toEqual(
        Object.values(nodeDisabled).map(() => false)
      );
    });

    it('disables a node with no tags if a tag filter is active', () => {
      const tag = mockState.tag.ids[0];
      const nodeTags = getNodeTags(mockState);
      // Choose a node that has no tags (and which should be disabled)
      const hasNoTags = (id) => !Boolean(nodeTags[id].length);
      const disabledNodeID = getNodeIDs(mockState).find(hasNoTags);
      // Update the state to enable one of the tags for that node
      const newMockState = reducer(mockState, toggleTagFilter(tag, true));
      expect(getNodeDisabledTag(newMockState)[disabledNodeID]).toEqual(true);
    });

    it('does not disable a node if only one of its several tag filters are active', () => {
      const nodeTags = getNodeTags(mockState);
      // Choose a node that has > 1 tag
      const enabledNodeID = getNodeIDs(mockState).find(
        (id) => nodeTags[id].length > 1
      );
      // Update the state to enable one of the tags for that node
      const enabledNodeTags = nodeTags[enabledNodeID];
      const newMockState = reducer(
        mockState,
        toggleTagFilter(enabledNodeTags[0], true)
      );
      expect(getNodeDisabledTag(newMockState)[enabledNodeID]).toEqual(false);
    });

    it('does not disable a node if all of its several tag filters are active', () => {
      const nodeTags = getNodeTags(mockState);
      // Choose a node that has > 1 tag
      const enabledNodeID = getNodeIDs(mockState).find(
        (id) => nodeTags[id].length > 1
      );
      // Update the state to activate all of the tag filters for that node
      const enabledNodeTags = nodeTags[enabledNodeID];
      const newMockState = enabledNodeTags.reduce(
        (state, tag) => reducer(state, toggleTagFilter(tag, true)),
        mockState
      );
      expect(getNodeDisabledTag(newMockState)[enabledNodeID]).toEqual(false);
    });
  });

  describe('getNodeDisabled', () => {
    it('returns an object', () => {
      expect(getNodeDisabled(mockState)).toEqual(expect.any(Object));
    });

    it("returns an object whose keys match the current pipeline's nodes", () => {
      expect(Object.keys(getNodeDisabled(mockState))).toEqual(
        getNodeIDs(mockState)
      );
    });

    it('returns an object whose values are all Booleans', () => {
      expect(
        Object.values(getNodeDisabled(mockState)).every(
          (value) => typeof value === 'boolean'
        )
      ).toBe(true);
    });
  });

  describe('getEdgeDisabled', () => {
    it('returns an object', () => {
      expect(getEdgeDisabled(mockState)).toEqual(expect.any(Object));
    });

    it("returns an object whose keys match the current pipeline's edges", () => {
      expect(Object.keys(getEdgeDisabled(mockState))).toEqual(
        getEdgeIDs(mockState)
      );
    });

    it('returns an object whose values are all Booleans', () => {
      expect(
        Object.values(getEdgeDisabled(mockState)).every(
          (value) => typeof value === 'boolean'
        )
      ).toBe(true);
    });

    it('returns an object', () => {
      expect(getEdgeDisabled(mockState)).toEqual(expect.any(Object));
    });

    it("returns an object whose keys match the current pipeline's edges", () => {
      expect(Object.keys(getEdgeDisabled(mockState))).toEqual(
        getEdgeIDs(mockState)
      );
    });

    it('returns an object whose values are all Booleans', () => {
      expect(
        Object.values(getEdgeDisabled(mockState)).every(
          (value) => typeof value === 'boolean'
        )
      ).toBe(true);
    });
  });

  describe('getVisibleLayerIDs', () => {
    it('returns an array of layer IDs', () => {
      expect(getVisibleLayerIDs(mockState)).toEqual(mockState.layer.ids);
    });

    it('returns an empty array if layers are disabled', () => {
      const newMockState = reducer(mockState, toggleLayers(false));
      expect(getVisibleLayerIDs(newMockState)).toEqual([]);
    });

    it('returns an empty array if there are no layers', () => {
      const newMockState = {
        ...mockState,
        layer: {
          ids: [],
          visible: true,
        },
      };
      expect(getVisibleLayerIDs(newMockState)).toEqual([]);
    });
  });
});
