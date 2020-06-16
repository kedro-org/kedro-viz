import { offsetNode, offsetEdge } from './common';
import { layout } from './layout';
import { routing } from './routing';

const defaultOptions = {
  layout: {
    spaceX: 16,
    spaceY: 110,
    layerSpaceY: 55,
    basisX: 1500,
    padding: 100
  },
  routing: {
    spaceX: 26,
    spaceY: 28,
    minPassageGap: 40,
    stemUnit: 8,
    stemMinSource: 5,
    stemMinTarget: 5,
    stemMax: 20,
    stemSpaceSource: 6,
    stemSpaceTarget: 10
  }
};

/**
 * Generates a diagram of the given DAG.
 * Input nodes and edges are updated in-place.
 * Results are stored as `x, y` properties on nodes
 * and `points` properties on edges.
 * @param {array} nodes The input nodes
 * @param {array} edges The input edges
 * @param {object=} layers The node layers if specified
 * @param {object=} options The graph options
 * @returns {object} The generated graph
 */
export const graph = (nodes, edges, layers, options = defaultOptions) => {
  addEdgeLinks(nodes, edges);

  layout({ nodes, edges, layers, ...options.layout });
  routing({ nodes, edges, layers, ...options.routing });

  const size = bounds(nodes, options.layout.padding);
  nodes.forEach(node => offsetNode(node, size.min));
  edges.forEach(edge => offsetEdge(edge, size.min));

  return {
    nodes,
    edges,
    layers,
    size
  };
};

/**
 * Adds lists of source edges and target edges to each node in-place
 * @param {array} nodes The input nodes
 * @param {array} edges The input edges
 */
const addEdgeLinks = (nodes, edges) => {
  const nodeById = {};

  for (const node of nodes) {
    nodeById[node.id] = node;
    node.targets = [];
    node.sources = [];
  }

  for (const edge of edges) {
    edge.sourceNode = nodeById[edge.source];
    edge.targetNode = nodeById[edge.target];
    edge.sourceNode.targets.push(edge);
    edge.targetNode.sources.push(edge);
  }
};

/**
 * Finds the region bounding the given nodes
 * @param {array} nodes The input nodes
 * @param {number} padding Additional padding around the bounds
 * @returns {object} The bounds
 */
const bounds = (nodes, padding) => {
  const size = {
    min: { x: Infinity, y: Infinity },
    max: { x: -Infinity, y: -Infinity }
  };

  for (const node of nodes) {
    const x = node.x;
    const y = node.y;

    if (x < size.min.x) size.min.x = x;
    if (x > size.max.x) size.max.x = x;
    if (y < size.min.y) size.min.y = y;
    if (y > size.max.y) size.max.y = y;
  }

  size.width = size.max.x - size.min.x + 2 * padding;
  size.height = size.max.y - size.min.y + 2 * padding;
  size.min.x -= padding;
  size.min.y -= padding;

  return size;
};
