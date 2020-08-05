import dagre from 'dagre';
import { graph } from './graph';

/**
 * Calculate chart layout with experimental newgraph algorithm
 * This is an extremely expensive operation so we want it to run as infrequently
 * as possible, and keep it separate from other properties (like node.active)
 * which don't affect layout.
 */
export const graphNew = ({ nodes, edges, layers }) => {
  const result = graph(nodes, edges, layers);
  return {
    ...result,
    size: { ...result.size, marginx: 100, marginy: 100 },
    newgraph: true
  };
};

/**
 * Calculate chart layout with Dagre.js.
 * This is an extremely expensive operation so we want it to run as infrequently
 * as possible, and keep it separate from other properties (like node.active)
 * which don't affect layout.
 */
export const graphDagre = ({ nodes, edges, layers }) => {
  const ranker = layers ? 'none' : null;
  const graph = new dagre.graphlib.Graph().setGraph({
    ranker: layers ? ranker : null,
    ranksep: layers ? 200 : 70,
    marginx: 40,
    marginy: 40
  });

  nodes.forEach(node => {
    graph.setNode(node.id, node);
  });

  edges.forEach(edge => {
    graph.setEdge(edge.source, edge.target, edge);
  });

  // Run Dagre layout to calculate X/Y positioning
  dagre.layout(graph);

  return {
    nodes: graph.nodes().map(id => {
      const node = graph.node(id);
      return {
        ...node,
        order: node.x + node.y * 9999
      };
    }),
    edges: graph.edges().map(id => graph.edge(id)),
    size: graph.graph(),
    newgraph: false
  };
};
