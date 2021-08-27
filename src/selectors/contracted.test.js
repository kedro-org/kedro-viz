import { mockState } from '../utils/state.mock';
import { getContractedModularPipelines } from './contracted';
import batchingToposort from 'batching-toposort';

const isToposortable = (edges) => {
  // Convert the edge graph to batching-toposort format
  const graph = {};

  for (const edgeID of edges.ids) {
    const source = edges.sources[edgeID];
    const target = edges.targets[edgeID];
    graph[source] = graph[source] || [];
    graph[target] = graph[target] || [];
    graph[source].push(target);
  }

  try {
    batchingToposort(graph);
    return true;
  } catch (e) {
    throw e;
  }
};

describe('Selectors', () => {
  describe('getContractedModularPipelines', () => {
    const contractedDemo = getContractedModularPipelines(mockState.demo);
    const contractedAnimals = getContractedModularPipelines(mockState.animals);
    const contractedTest = getContractedModularPipelines(mockState.contracting);

    it('returns in expected format', () => {
      expect(contractedAnimals).toEqual(
        expect.objectContaining({
          node: expect.objectContaining({
            ids: expect.any(Object),
            name: expect.any(Object),
            fullName: expect.any(Object),
            type: expect.any(Object),
            layer: expect.any(Object),
            modularPipeline: expect.any(Object),
          }),
          edge: expect.objectContaining({
            ids: expect.any(Object),
            sources: expect.any(Object),
            targets: expect.any(Object),
          }),
        })
      );
    });

    it('after contracted all mock graphs have less nodes than their original', () => {
      expect(contractedDemo.node.ids.length).toBeLessThan(
        mockState.demo.node.ids.length
      );

      expect(contractedAnimals.node.ids.length).toBeLessThan(
        mockState.animals.node.ids.length
      );

      expect(contractedTest.node.ids.length).toBeLessThan(
        mockState.contracting.node.ids.length
      );
    });

    it('after contracted all mock graphs have less edges than their original', () => {
      expect(contractedDemo.edge.ids.length).toBeLessThan(
        mockState.demo.edge.ids.length
      );

      expect(contractedAnimals.edge.ids.length).toBeLessThan(
        mockState.animals.edge.ids.length
      );

      expect(contractedTest.edge.ids.length).toBeLessThan(
        mockState.contracting.edge.ids.length
      );
    });

    it('after contracted all mock graphs form a toposortable DAG (with no edge cycles)', () => {
      expect(isToposortable(contractedTest.edge)).toBe(true);
      expect(isToposortable(contractedAnimals.edge)).toBe(true);
      expect(isToposortable(contractedDemo.edge)).toBe(true);
    });

    it('after contracted the test mock graph has only top level modular pipeline and element nodes', () => {
      // Expect only two nodes after contracting the test graph
      expect(Object.values(contractedTest.node.name)).toStrictEqual([
        // Top level element node
        'C',
        // Top level modular pipeline node
        'Clean',
      ]);
    });

    it('after contracted the test mock graph has only top level modular pipeline and element edges', () => {
      // Expect a single edge after contracting the test graph
      expect(contractedTest.edge.ids).toStrictEqual([
        // The top level modular pipeline node to the top level element node
        'clean-clean-91be94d4|84a51684',
      ]);
    });
  });
});
