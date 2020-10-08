import { offsetNode, offsetEdge } from './common';
import { layout } from './layout';
import { routing } from './routing';

const defaultOptions = {
  layout: {
    spaceX: 16,
    spaceY: 110,
    layerSpaceY: 55,
    basisX: 1500,
    padding: 100,
    iterations: 20
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
  addNearestLayers(nodes, layers);

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
export const addEdgeLinks = (nodes, edges) => {
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
 * Adds the nearest layer to each node based on the layers of its connected nodes in-place
 * @param {array} nodes The input nodes
 * @param {?array} layers The input layers
 */
const addNearestLayers = (nodes, layers) => {
  if (layers && layers.length > 0) {
    // Only accept layers specififed in the layers list.
    const layersMap = layers.reduce(
      (res, layer) => ({ ...res, [layer]: true }),
      {}
    );
    const hasValidLayer = node => Boolean(layersMap[node.layer]);

    for (const node of nodes) {
      const layerNode = findNodeBy(
        node,
        targetThenSourceNodes,
        nodeDistance,
        hasValidLayer
      );
      node.nearestLayer = layerNode && layerNode.layer;
    }
  }
};

/**
 * Returns the list of the node's connected target nodes followed by its connected source nodes
 * @param {object} node The input node
 * @returns {array} The connected nodes
 */
const targetThenSourceNodes = node =>
  targetNodes(node).concat(sourceNodes(node));

/**
 * Returns the list of target nodes directly connected to the given node
 * @param {object} node The input node
 * @returns {array} The target nodes
 */
const targetNodes = node => node.targets.map(edge => edge.targetNode);

/**
 * Returns the list of source nodes directly connected to the given node
 * @param {object} node The input node
 * @returns {array} The source nodes
 */
const sourceNodes = node => node.sources.map(edge => edge.sourceNode);

/**
 * Returns the distance between the two nodes using their assigned rank
 * @param {object} nodeA The first input node
 * @param {object} nodeB The second input node
 * @returns {number} The distance
 */
const nodeDistance = (nodeA, nodeB) => Math.abs(nodeA.rank - nodeB.rank);

/**
 * Starting at the given node and expanding successors, returns the first node accepted relative to the metric
 * @param {object} node The starting node
 * @param {function} successors A function returning the next nodes to expand
 * @param {function} metric A function that measures the difference between two nodes
 * @param {function} accept A function that returns true if the current node fits the criteria
 * @param {object=} visited An object keeping track of nodes already searched
 * @returns {?object} The first node accepted, if found
 */
const findNodeBy = (node, successors, metric, accept, visited) => {
  if (accept(node)) return node;

  visited = visited || {};
  visited[node.id] = true;

  const next = successors(node).filter(node => !visited[node.id]);
  const nearest = next.sort(
    (nodeA, nodeB) => metric(node, nodeA) - metric(node, nodeB)
  );
  const accepted = nearest.filter(accept);

  return (
    accepted[0] ||
    nearest.map(node =>
      findNodeBy(node, successors, metric, accept, visited)
    )[0]
  );
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
