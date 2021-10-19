import { mockState } from '../utils/state.mock';
import {
  getNodeDisabledTag,
  getNodeDisabledModularPipeline,
  getNodeDisabled,
  getEdgeDisabled,
  getVisibleNodeIDs,
  getVisibleLayerIDs,
} from './disabled';
import { toggleNodesDisabled } from '../actions/nodes';
import { toggleLayers, toggleFocusMode } from '../actions';
import { toggleTagFilter } from '../actions/tags';
import reducer from '../reducers';
import { toggleTypeDisabled } from '../actions/node-type';

const getNodeIDs = (state) => state.node.ids;
const getEdgeIDs = (state) => state.edge.ids;
const getEdgeSources = (state) => state.edge.sources;
const getEdgeTargets = (state) => state.edge.targets;
const getNodeTags = (state) => state.node.tags;

describe('Selectors', () => {
  describe('getNodeDisabledTag', () => {
    it("returns an object whose keys match the current pipeline's nodes", () => {
      expect(Object.keys(getNodeDisabledTag(mockState.spaceflights))).toEqual(
        getNodeIDs(mockState.spaceflights)
      );
    });

    it('returns an object whose values are all Booleans', () => {
      expect(
        Object.values(getNodeDisabledTag(mockState.spaceflights)).every(
          (value) => typeof value === 'boolean'
        )
      ).toBe(true);
    });

    it('does not disable any nodes if all tags filters are inactive', () => {
      const nodeDisabled = getNodeDisabledTag(mockState.spaceflights);
      expect(Object.values(nodeDisabled)).toEqual(
        Object.values(nodeDisabled).map(() => false)
      );
    });

    it('disables a node with no tags if a tag filter is active', () => {
      const tag = mockState.spaceflights.tag.ids[0];
      const nodeTags = getNodeTags(mockState.spaceflights);
      // Choose a node that has no tags (and which should be disabled)
      const hasNoTags = (id) => !Boolean(nodeTags[id].length);
      const disabledNodeID = getNodeIDs(mockState.spaceflights).find(hasNoTags);
      // Update the state to enable one of the tags for that node
      const newMockState = reducer(
        mockState.spaceflights,
        toggleTagFilter(tag, true)
      );
      expect(getNodeDisabledTag(newMockState)[disabledNodeID]).toEqual(true);
    });

    it('does not disable a node if only one of its several tag filters are active', () => {
      const nodeTags = getNodeTags(mockState.spaceflights);
      // Choose a node that has > 1 tag
      const enabledNodeID = getNodeIDs(mockState.spaceflights).find(
        (id) => nodeTags[id].length > 1
      );
      // Update the state to enable one of the tags for that node
      const enabledNodeTags = nodeTags[enabledNodeID];
      const newMockState = reducer(
        mockState.spaceflights,
        toggleTagFilter(enabledNodeTags[0], true)
      );
      expect(getNodeDisabledTag(newMockState)[enabledNodeID]).toEqual(false);
    });

    it('does not disable a node if all of its several tag filters are active', () => {
      const nodeTags = getNodeTags(mockState.spaceflights);
      // Choose a node that has > 1 tag
      const enabledNodeID = getNodeIDs(mockState.spaceflights).find(
        (id) => nodeTags[id].length > 1
      );
      // Update the state to activate all of the tag filters for that node
      const enabledNodeTags = nodeTags[enabledNodeID];
      const newMockState = enabledNodeTags.reduce(
        (state, tag) => reducer(state, toggleTagFilter(tag, true)),
        mockState.spaceflights
      );
      expect(getNodeDisabledTag(newMockState)[enabledNodeID]).toEqual(false);
    });
  });

  describe('getNodeDisabledModularPipeline', () => {
    it('returns an object', () => {
      expect(getNodeDisabledModularPipeline(mockState.spaceflights)).toEqual(
        expect.any(Object)
      );
    });

    it("returns an object whose keys match the current pipeline's nodes", () => {
      expect(
        Object.keys(getNodeDisabledModularPipeline(mockState.spaceflights))
      ).toEqual(getNodeIDs(mockState.spaceflights));
    });

    it('returns an object whose values are all Booleans', () => {
      expect(
        Object.values(
          getNodeDisabledModularPipeline(mockState.spaceflights)
        ).every((value) => typeof value === 'boolean')
      ).toBe(true);
    });

    it('assigns a node that is an input to a modular pipeline to active status', () => {
      const newMockState = reducer(
        mockState.spaceflights,
        toggleFocusMode({ id: 'data_science' })
      );

      expect(getNodeDisabledModularPipeline(newMockState)['23c94afb']).toEqual(
        false
      );
    });
  });

  describe('getNodeDisabled', () => {
    it('returns an object', () => {
      expect(getNodeDisabled(mockState.spaceflights)).toEqual(
        expect.any(Object)
      );
    });

    it("returns an object whose keys match the current pipeline's nodes", () => {
      expect(Object.keys(getNodeDisabled(mockState.spaceflights))).toEqual(
        getNodeIDs(mockState.spaceflights)
      );
    });

    it('returns an object whose values are all Booleans', () => {
      expect(
        Object.values(getNodeDisabled(mockState.spaceflights)).every(
          (value) => typeof value === 'boolean'
        )
      ).toBe(true);
    });
  });

  describe('getEdgeDisabled', () => {
    const nodeID = getNodeIDs(mockState.spaceflights)[0];
    const tempMockState = reducer(
      mockState.spaceflights,
      toggleNodesDisabled([nodeID], true)
    );
    const newMockState = reducer(
      tempMockState,
      toggleTypeDisabled('parameters', false)
    );
    const edgeDisabled = getEdgeDisabled(newMockState);
    const edges = getEdgeIDs(newMockState);

    it('returns an object', () => {
      expect(getEdgeDisabled(mockState.spaceflights)).toEqual(
        expect.any(Object)
      );
    });

    it("returns an object whose keys match the current pipeline's edges", () => {
      expect(Object.keys(getEdgeDisabled(mockState.spaceflights))).toEqual(
        getEdgeIDs(mockState.spaceflights)
      );
    });

    it('returns an object whose values are all Booleans', () => {
      expect(
        Object.values(getEdgeDisabled(mockState.spaceflights)).every(
          (value) => typeof value === 'boolean'
        )
      ).toBe(true);
    });

    it('does not disable an edge if no nodes are disabled', () => {
      const newMockState = reducer(
        mockState.spaceflights,
        toggleTypeDisabled('parameters', false)
      );
      const edgeDisabledValues = Object.values(getEdgeDisabled(newMockState));
      expect(edgeDisabledValues).toEqual(edgeDisabledValues.map(() => false));
    });

    it('disables an edge if one of its nodes is disabled', () => {
      const edgeDisabled = getEdgeDisabled(newMockState);
      const edges = getEdgeIDs(newMockState);
      const disabledEdges = Object.keys(edgeDisabled).filter(
        (id) => edgeDisabled[id]
      );
      const disabledEdgesMock = edges.filter(
        (id) =>
          getEdgeSources(newMockState)[id] === nodeID ||
          getEdgeTargets(newMockState)[id] === nodeID
      );
      expect(disabledEdges).toEqual(disabledEdgesMock);
    });

    it('does not disable an edge if none of its nodes are disabled', () => {
      const enabledEdges = Object.keys(edgeDisabled).filter(
        (id) => !edgeDisabled[id]
      );
      const enabledEdgesMock = edges.filter(
        (id) =>
          getEdgeSources(newMockState)[id] !== nodeID &&
          getEdgeTargets(newMockState)[id] !== nodeID
      );
      expect(enabledEdges).toEqual(enabledEdgesMock);
    });

    it('returns an object', () => {
      expect(getEdgeDisabled(mockState.spaceflights)).toEqual(
        expect.any(Object)
      );
    });

    it("returns an object whose keys match the current pipeline's edges", () => {
      expect(Object.keys(getEdgeDisabled(mockState.spaceflights))).toEqual(
        getEdgeIDs(mockState.spaceflights)
      );
    });

    it('returns an object whose values are all Booleans', () => {
      expect(
        Object.values(getEdgeDisabled(mockState.spaceflights)).every(
          (value) => typeof value === 'boolean'
        )
      ).toBe(true);
    });
  });

  describe('getVisibleNodeIDs', () => {
    const newMockState = reducer(
      mockState.spaceflights,
      toggleTypeDisabled('parameters', false)
    );
    it('returns an array of node IDs', () => {
      expect(getVisibleNodeIDs(newMockState)).toEqual(newMockState.node.ids);
    });
  });

  describe('getVisibleLayerIDs', () => {
    it('returns an array of layer IDs', () => {
      expect(getVisibleLayerIDs(mockState.spaceflights)).toEqual(
        mockState.spaceflights.layer.ids
      );
    });

    it('returns an empty array if layers are disabled', () => {
      const newMockState = reducer(mockState.spaceflights, toggleLayers(false));
      expect(getVisibleLayerIDs(newMockState)).toEqual([]);
    });

    it('returns an empty array if there are no layers', () => {
      const newMockState = {
        ...mockState.spaceflights,
        layer: {
          ids: [],
          visible: true,
        },
      };
      expect(getVisibleLayerIDs(newMockState)).toEqual([]);
    });
  });
});
