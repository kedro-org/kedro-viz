import { mockState, prepareState } from '../utils/state.mock';
import animals from '../utils/data/animals.mock.json';
import {
  getNodeDisabledPipeline,
  getPipelineNodeIDs,
  getPipelineTagIDs,
} from './pipeline';
import reducer from '../reducers';
import { updateActivePipeline } from '../actions/pipelines';

const getNodeIDs = (state) => state.node.ids;
const getNodePipelines = (state) => state.node.pipelines;
const getActivePipeline = (state) => state.pipeline.active;
const getTagIDs = (state) => state.tag.ids;

describe('Selectors', () => {
  describe('getNodeDisabledPipeline', () => {
    it("returns an object whose keys match the current pipeline's nodes", () => {
      expect(Object.keys(getNodeDisabledPipeline(mockState.animals))).toEqual(
        getNodeIDs(mockState.animals)
      );
    });

    it('returns an object whose values are all Booleans', () => {
      expect(
        Object.values(getNodeDisabledPipeline(mockState.animals)).every(
          (value) => typeof value === 'boolean'
        )
      ).toBe(true);
    });

    it('does not disable any nodes if there is no active pipeline', () => {
      const activePipeline = undefined;
      const newMockState = reducer(
        mockState.animals,
        updateActivePipeline(activePipeline)
      );
      const nodeDisabledPipeline = getNodeDisabledPipeline(newMockState);
      expect(
        mockState.animals.node.ids.every(
          (nodeID) => !nodeDisabledPipeline[nodeID]
        )
      ).toBe(true);
    });

    it('does not disable any nodes that are in the active pipeline', () => {
      const activePipeline = 'ds';
      const activePipelineNodeIDs = mockState.animals.node.ids.filter(
        (nodeID) => mockState.animals.node.pipelines[nodeID][activePipeline]
      );
      const newMockState = reducer(
        mockState.animals,
        updateActivePipeline(activePipeline)
      );
      const nodeDisabledPipeline = getNodeDisabledPipeline(newMockState);
      expect(
        activePipelineNodeIDs.every((nodeID) => !nodeDisabledPipeline[nodeID])
      ).toBe(true);
    });

    it('disables every node that is not in the active pipeline', () => {
      const activePipeline = 'de';
      const inactivePipelineNodeIDs = mockState.animals.node.ids.filter(
        (nodeID) => !mockState.animals.node.pipelines[nodeID][activePipeline]
      );
      const newMockState = reducer(
        mockState.animals,
        updateActivePipeline(activePipeline)
      );
      const nodeDisabledPipeline = getNodeDisabledPipeline(newMockState);
      expect(
        inactivePipelineNodeIDs.every((nodeID) => nodeDisabledPipeline[nodeID])
      ).toBe(true);
    });

    it('does not disable any nodes if loading data asynchronously', () => {
      expect(getNodeDisabledPipeline(mockState.json)).toEqual({});
    });

    it('does not disable any nodes if there is no active pipeline', () => {
      const newMockState = reducer(
        mockState.animals,
        updateActivePipeline(undefined)
      );
      expect(getNodeDisabledPipeline(newMockState)).toEqual({});
    });
  });

  describe('getPipelineNodeIDs', () => {
    const nodeIDs = getNodeIDs(mockState.animals);
    const pipelineNodeIDs = getPipelineNodeIDs(mockState.animals);
    const nodePipelines = getNodePipelines(mockState.animals);
    const activePipeline = getActivePipeline(mockState.animals);

    it('returns an array of node IDs', () => {
      expect(pipelineNodeIDs).toEqual(expect.arrayContaining(nodeIDs));
    });

    it('does not contain any nodes that are not in the current pipeline', () => {
      expect(
        pipelineNodeIDs.every((nodeID) => nodePipelines[nodeID][activePipeline])
      ).toBe(true);
    });

    it('contains all nodes in the current pipeline', () => {
      const inactivePipelineNodeIDs = pipelineNodeIDs.filter(
        (nodeID) => nodePipelines[nodeID][activePipeline]
      );
      inactivePipelineNodeIDs.forEach((nodeID) => {
        expect(pipelineNodeIDs).toContain(nodeID);
      });
    });

    it('returns zero nodes for an empty pipeline', () => {
      const newMockState = reducer(
        mockState.animals,
        updateActivePipeline('empty')
      );
      expect(getPipelineNodeIDs(newMockState)).toHaveLength(0);
    });
  });

  describe('getPipelineTagIDs', () => {
    it('returns an array of tag IDs', () => {
      expect(getPipelineTagIDs(mockState.animals)).toEqual(
        expect.arrayContaining(getTagIDs(mockState.animals))
      );
    });

    it('does not contain any tags that are not in the current pipeline', () => {
      const tag = { id: 'unused_tag' };
      const node = {
        id: 'new',
        tags: [tag.id],
        pipelines: ['unused_pipeline'], // not included in default pipeline
      };
      const data = { ...animals };
      data.tags = [...data.tags, tag];
      data.nodes = [...data.nodes, node];
      const state = prepareState({ data });
      expect(getPipelineTagIDs(state)).not.toContain(tag.id);
    });

    it('returns zero tags for an empty pipeline', () => {
      const newMockState = reducer(
        mockState.animals,
        updateActivePipeline('empty')
      );
      expect(getPipelineTagIDs(newMockState)).toHaveLength(0);
    });
  });
});
