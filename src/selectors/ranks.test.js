import { mockState } from '../utils/state.mock';
import { getLayerNodes, getNodeRank } from './ranks';
import { getVisibleNodeIDs, getVisibleLayerIDs } from './disabled';
import { getVisibleEdges } from './edges';
import { toggleLayers } from '../actions';
import reducer from '../reducers';

const getNodeLayer = state => state.node.layer;

describe('Selectors', () => {
  describe('getLayerNodes', () => {
    it('returns an array containing an array of node IDs', () => {
      expect(getLayerNodes(mockState.testData)).toEqual(
        expect.arrayContaining([expect.arrayContaining([expect.any(String)])])
      );
    });

    test('all node IDs are in the correct layer', () => {
      const layerIDs = getVisibleLayerIDs(mockState.testData);
      const nodeLayer = getNodeLayer(mockState.testData);
      expect(
        getLayerNodes(mockState.testData).every((layerNodeIDs, i) =>
          layerNodeIDs.every(nodeID => nodeLayer[nodeID] === layerIDs[i])
        )
      ).toBe(true);
    });

    it('returns an empty array if layers are disabled', () => {
      const newMockState = reducer(mockState.testData, toggleLayers(false));
      expect(getLayerNodes(newMockState)).toEqual([]);
    });
  });

  describe('getNodeRank', () => {
    const nodeRank = getNodeRank(mockState.testData);
    const nodeIDs = getVisibleNodeIDs(mockState.testData);
    const edges = getVisibleEdges(mockState.testData);

    it('returns an object', () => {
      expect(nodeRank).toEqual(expect.any(Object));
    });

    it('returns an object containing ranks for each node ID', () => {
      expect(nodeRank).toEqual(
        nodeIDs.reduce((ranks, nodeID) => {
          ranks[nodeID] = expect.any(Number);
          return ranks;
        }, {})
      );
    });

    test('for every edge, the source rank is less than the target rank', () => {
      expect(
        edges.every(edge => nodeRank[edge.source] < nodeRank[edge.target])
      ).toBe(true);
    });

    it('returns an empty object if layers are disabled', () => {
      const newMockState = reducer(mockState.testData, toggleLayers(false));
      expect(getNodeRank(newMockState)).toEqual({});
    });
  });
});
