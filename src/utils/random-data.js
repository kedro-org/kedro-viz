import batchingToposort from 'batching-toposort';

import { arrayToObject, unique } from './index';
import {
  getNumberArray,
  random,
  randomIndex,
  randomNumber,
  randomNumberBetween,
  getRandom,
  getRandomName,
  getRandomSelection
} from './random-utils';

//--- Config variables ---//

const MAX_EDGE_COUNT = 150;
const MIN_EDGE_COUNT = 50;
const MAX_RANK_COUNT = 50;
const MIN_RANK_COUNT = 10;
const MAX_RANK_NODE_COUNT = 10;
const MIN_RANK_NODE_COUNT = 1;
const MAX_NODE_TAG_COUNT = 5;
const MIN_NODE_DEGREE = 2;
const MAX_TAG_COUNT = 20;
const PARAMETERS_FREQUENCY = 0.2;
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

    this.update();
    this.finalise();
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
      for (let i = 0; i < rankNodeCount; i++) {
        const node = this.createNode(i, rank);
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
  getType(node) {
    if (node.rank % 2) {
      return 'task';
    }

    if (node._sources.length === 0 && random() < PARAMETERS_FREQUENCY) {
      return 'parameters';
    }

    return 'data';
  }

  /**
   * Create a node datum object.
   * @param {number} i Node index within its rank
   * @param {number} initialRank Rank index
   * @returns {object} Node object
   */
  createNode(i, initialRank) {
    const layer = this.rankLayers[initialRank];
    const node = {
      id: `${layer}_${initialRank}_${i}`,
      name: null,
      full_name: null,
      type: null,
      rank: initialRank,
      layer: layer,
      tags: this.getRandomTags(),
      _sources: [],
      _targets: []
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
    const maxEdgeCount = randomNumberBetween(MIN_EDGE_COUNT, MAX_EDGE_COUNT);

    // Sort nodes rank ascending
    const nodesByRank = [...this.nodes].sort((a, b) => a.rank - b.rank);

    // Find the position of the first node of the last rank
    const lastRank = nodesByRank[nodesByRank.length - 1].rank;
    const lastRankFirstIndex = nodesByRank.findIndex(
      node => node.rank === lastRank
    );

    // For the desired amount of edges
    for (let i = 0; i < maxEdgeCount; i += 1) {
      // Choose a random starting node excluding the last rank
      const sourceIndex = randomIndex(lastRankFirstIndex - 1);
      const source = nodesByRank[sourceIndex];

      // Find the position of the first node of the next rank
      const nextRankFirstIndex = nodesByRank.findIndex(
        node => node.rank > source.rank
      );

      // Find the remaining count of nodes
      const successorCount = nodesByRank.length - nextRankFirstIndex - 1;

      // Choose random successor starting from next rank, prefer closer ranks
      const randomSuccessor = Math.round(
        Math.min(1 / random(), successorCount)
      );
      const targetIndex = nextRankFirstIndex + randomSuccessor;
      const target = nodesByRank[targetIndex];

      // Build the edge
      const edge = {
        source: source.id,
        target: target.id,
        _sourceNode: source,
        _targetNode: target
      };

      edges.push(edge);

      // Keep track of edges on nodes for later convenience
      source._targets.push(edge);
      target._sources.push(edge);
    }

    return edges;
  }

  /**
   * Select only nodes with at least the minimum required connected nodes
   * @returns {object} Filtered nodes
   */
  activeNodes() {
    const nodes = {};

    // Gets the total number of edges for the given node
    const degree = node => node._sources.length + node._targets.length;

    for (const edge of this.edges) {
      // Keep both nodes if they have enough combined connections
      if (
        degree(edge._sourceNode) + degree(edge._targetNode) >
        MIN_NODE_DEGREE
      ) {
        nodes[edge._sourceNode.id] = edge._sourceNode;
        nodes[edge._targetNode.id] = edge._targetNode;
      }
    }

    return Object.values(nodes);
  }

  /**
   * Select only used tags
   * @returns {object} Filtered tags
   */
  activeTags() {
    return this.nodes
      .reduce((tags, node) => (node.tags ? tags.concat(node.tags) : tags), [])
      .filter(unique)
      .map(tag => ({ name: tag, id: tag }));
  }

  /**
   * Select only used edges
   * @returns {object} Filtered edges
   */
  activeEdges() {
    const nodeExists = id => Boolean(this.nodes.find(node => node.id === id));
    return this.edges.filter(
      edge => nodeExists(edge.target) && nodeExists(edge.source)
    );
  }

  /**
   * Updates node properties including rank, type and name based on the current graph
   */
  update() {
    const graph = {};

    for (const node of this.nodes) {
      graph[node.id] = [];
    }

    for (const edge of this.edges) {
      graph[edge.source].push(edge.target);
    }

    // Use toposort to find actual ranks
    const sortedNodes = batchingToposort(graph);

    for (let rank = 0; rank < sortedNodes.length; rank++) {
      for (const id of sortedNodes[rank]) {
        const node = this.nodes.find(node => node.id === id);
        node.rank = rank;
        node.type = this.getType(node);
        node.name = this.getNodeName(node.type);
        node.full_name = `${node.layer}_${node.type}_${node.rank}_${
          node.name
        }`.replace(/\s/g, '_');
      }
    }
  }

  /**
   * Removes unused elements and cleans up temporary properties
   */
  finalise() {
    this.nodes = this.activeNodes();
    this.tags = this.activeTags();
    this.edges = this.activeEdges();

    for (const node of this.nodes) {
      delete node._sources;
      delete node._targets;
    }

    for (const edge of this.edges) {
      delete edge._targetNode;
      delete edge._sourceNode;
    }
  }

  /**
   * Gets the complete pipeline data
   * @returns {object} The pipeline data
   */
  all() {
    return {
      edges: this.edges,
      nodes: this.nodes,
      tags: this.tags,
      layers: LAYERS
    };
  }
}

const generateRandomPipeline = () => new Pipeline().all();

export default generateRandomPipeline;
