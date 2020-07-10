import dagre from 'dagre';
import { graph } from './newgraph';

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
    graph: { ...result.size, marginx: 100, marginy: 100 },
    newgraph: true
  };
};

/**
 * Calculate chart layout with Dagre.js.
 * This is an extremely expensive operation so we want it to run as infrequently
 * as possible, and keep it separate from other properties (like node.active)
 * which don't affect layout.
 */
export const graphDagre = ({ nodes, edges, showLayers }) => {
  const ranker = showLayers ? 'none' : null;
  const graph = new dagre.graphlib.Graph().setGraph({
    ranker: showLayers ? ranker : null,
    ranksep: showLayers ? 200 : 70,
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
    nodes: graph.nodes().map(graph.node),
    edges: graph.edges().map(graph.edge),
    graph: graph.graph()
  };
};
