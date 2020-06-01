import { arrayToObject, unique } from './index';
import {
  getNumberArray,
  randomNumber,
  randomNumberBetween,
  getRandom,
  getRandomName,
  getRandomSelection
} from './random-utils';

//--- Config variables ---//

const MIN_CONNECTED_NODES = 1;
const MAX_CONNECTED_NODES = 3;
const MAX_RANK_COUNT = 40;
const MIN_RANK_COUNT = 5;
const MAX_RANK_NODE_COUNT = 10;
const MIN_RANK_NODE_COUNT = 1;
const MAX_NODE_TAG_COUNT = 5;
const MAX_TAG_COUNT = 20;
const PARAMETERS_FREQUENCY = 0.05;
const LAYERS = [
  'Raw',
  'Intermediate',
  'Primary',
  'Feature',
  'Model Input',
  'Model Output'
];

/**
 * Generate a random pipeline dataset
 */
class Pipeline {
  constructor() {
    this.rankCount = this.getRankCount();
    this.rankLayers = this.getRankLayers();
    this.tags = this.generateTags();
    this.nodes = this.generateNodes();
    this.edges = this.generateEdges();
  }

  /**
   * Get the number of ranks (i.e. horizontal bands)
   * Odd ranks are data, even are task
   * @returns {number} Rank count total
   */
  getRankCount() {
    let rankCount = randomNumberBetween(MIN_RANK_COUNT, MAX_RANK_COUNT);
    // Ensure odd numbers only, so that we start and end with a data node
    if (!rankCount % 2) {
      rankCount += 1;
    }
    return rankCount;
  }

  /**
   * Randomly determine the layer for each rank
   * @returns {object} Layers by rank
   */
  getRankLayers() {
    const layerSize = arrayToObject(LAYERS, () => 0);
    // Randomly decide the number of ranks in each layer
    for (let i = 0; i < this.rankCount; i++) {
      layerSize[getRandom(LAYERS)]++;
    }
    // Assign layers to ranks based on layerSize
    const rankLayers = {};
    for (let rank = 0, layer = 0; rank < this.rankCount; rank++) {
      while (layerSize[LAYERS[layer]] < 1) {
        layer++;
      }
      rankLayers[rank] = LAYERS[layer];
      layerSize[LAYERS[layer]]--;
    }
    return rankLayers;
  }

  /**
   * Generate a random list of tags
   * @returns {array} Tag name strings
   */
  generateTags() {
    const tagCount = randomNumber(MAX_TAG_COUNT);
    return getNumberArray(tagCount)
      .map(() => getRandomName(randomNumber(MAX_NODE_TAG_COUNT)))
      .filter(unique);
  }

  /**
   * Create list of nodes
   * @returns {array} List of node objects
   */
  generateNodes() {
    const nodes = [];
    for (let rank = 0; rank < this.rankCount; rank++) {
      const rankNodeCount = this.getRankNodeCount(rank);
      const type = this.getType(rank);

      for (let i = 0; i < rankNodeCount; i++) {
        const node = this.createNode(i, rank, type);
        nodes.push(node);
      }
    }
    return nodes;
  }

  /**
   * Randomly calculate the number of nodes in a rank
   * @param {number} rank Rank number
   * @returns {number} rank node count
   */
  getRankNodeCount(rank) {
    const max = MAX_RANK_NODE_COUNT;
    const min = MIN_RANK_NODE_COUNT;
    const p = (this.rankCount - rank) / this.rankCount;
    return randomNumber(p * (max - min) + min);
  }

  /**
   * Determine a node's type based on its rank
   * @param {number} rank Rank number
   * @returns {string} Node type (task/data/parameters)
   */
  getType(rank) {
    if (rank % 2) {
      return 'task';
    }
    if (Math.random() < PARAMETERS_FREQUENCY) {
      return 'parameters';
    }
    return 'data';
  }

  /**
   * Create a node datum object
   * @param {number} i Node index within its rank
   * @param {number} rank Rank index
   * @param {number} type
   * @returns {object} Node object
   */
  createNode(i, rank, type) {
    const name = this.getNodeName(type);
    const node = {
      id: `${type}/${name}(${rank}-${i})`,
      name,
      full_name: getRandomName(randomNumber(40)),
      type,
      rank,
      layer: this.rankLayers[rank],
      tags: this.getRandomTags()
    };
    return node;
  }

  /**
   * Create a new node name of up to 10 words
   * @param {string} Node type (task/data/parameters)
   * @returns {string} Node name
   */
  getNodeName(type) {
    const name = getRandomName(randomNumber(10), ' ');
    return type === 'parameters' ? `Parameters ${name}` : name;
  }

  /**
   * Select a random number of tags from the list of tags
   * @returns {array} List of tags
   */
  getRandomTags() {
    return getRandomSelection(this.tags, randomNumber(this.tags.length));
  }

  /**
   * Create list of edges
   * @returns {array} Edge objects
   */
  generateEdges() {
    const edges = [];
    const dataNodes = this.nodes.filter(node => node.type === 'data');
    const taskNodes = this.nodes.filter(node => node.type !== 'data');
    const remainingEdgeCount = arrayToObject(
      dataNodes.map(node => node.id),
      () => MAX_CONNECTED_NODES
    );

    taskNodes.forEach(node => {
      const ancestors = dataNodes.filter(
        d => d.rank < node.rank && remainingEdgeCount[d.id]
      );
      this.getRandomNodes(ancestors).forEach(source => {
        edges.push({
          source: source.id,
          target: node.id
        });
        remainingEdgeCount[source.id]--;
      });

      const descendants = dataNodes.filter(
        d => d.rank > node.rank && remainingEdgeCount[d.id]
      );
      this.getRandomNodes(descendants).forEach(target => {
        edges.push({
          source: node.id,
          target: target.id
        });
        remainingEdgeCount[target.id]--;
      });
    });

    return edges;
  }

  /**
   * Get a random list of nodes to link to
   * @param {array} nodes List of nodes from which to choose
   * @returns {array} Randomly-selected nodes
   */
  getRandomNodes(nodes) {
    const connections = randomNumberBetween(
      MIN_CONNECTED_NODES,
      MAX_CONNECTED_NODES
    );
    return getRandomSelection(nodes, connections);
  }

  /**
   * Select only nodes that are connected to others
   * @returns {object} Filtered nodes
   */
  filterUnconnectedNodes() {
    const findMatchingEdge = node => edge =>
      node.id === edge.source || node.id === edge.target;

    return this.nodes.filter(
      node => this.edges.findIndex(findMatchingEdge(node)) >= 0
    );
  }

  /**
   * Select only used tags
   * @returns {object} Filtered tags
   */
  filterUnusedTags() {
    return this.nodes
      .reduce((tags, node) => (node.tags ? tags.concat(node.tags) : tags), [])
      .filter(unique)
      .map(tag => ({ name: tag, id: tag }));
  }

  /**
   * Get a complete JSON schema
   * @returns {object} Pipeline schema
   */
  getSchema() {
    return {
      edges: this.edges,
      layers: LAYERS,
      nodes: this.filterUnconnectedNodes(),
      tags: this.filterUnusedTags()
    };
  }
}

const generateRandomPipeline = () => new Pipeline().getSchema();

export default generateRandomPipeline;
