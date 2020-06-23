import { mockState } from '../utils/state.mock';
import { getLayerNodes, getNodeRank } from './ranks';
import { getVisibleNodeIDs, getVisibleLayerIDs } from './disabled';
import { getVisibleEdges } from './edges';

const getNodeLayer = state => state.node.layer;

describe('Selectors', () => {
  describe('getLayerNodes', () => {
    it('returns an array containing an array of node IDs', () => {
      expect(getLayerNodes(mockState.animals)).toEqual(
        expect.arrayContaining([expect.arrayContaining([expect.any(String)])])
      );
    });

    test('all node IDs are in the correct layer', () => {
      const layerIDs = getVisibleLayerIDs(mockState.animals);
      const nodeLayer = getNodeLayer(mockState.animals);
      expect(
        getLayerNodes(mockState.animals).every((layerNodeIDs, i) =>
          layerNodeIDs.every(nodeID => nodeLayer[nodeID] === layerIDs[i])
        )
      ).toBe(true);
    });
  });

  describe('getNodeRank', () => {
    const nodeRank = getNodeRank(mockState.animals);
    const nodeIDs = getVisibleNodeIDs(mockState.animals);
    const edges = getVisibleEdges(mockState.animals);

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
  });
});
