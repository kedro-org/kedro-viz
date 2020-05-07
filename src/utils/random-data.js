import {
  getNumberArray,
  randomIndex,
  randomNumber,
  randomNumberBetween,
  getRandomName,
  unique
} from './index';

//--- Config variables ---//

const MIN_CONNECTED_NODES = 1;
const MAX_CONNECTED_NODES = 2;
const MAX_RANK_COUNT = 20;
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
    this.tagCount = randomNumber(MAX_TAG_COUNT);
    this.tags = this.generateTags();
    this.nodes = this.generateNodes();
    this.edges = this.generateEdges();
  }

  getRankCount() {
    let rankCount = randomNumberBetween(MIN_RANK_COUNT, MAX_RANK_COUNT);
    // Ensure odd numbers only, so that we start and end with a data node
    if (!rankCount % 2) {
      rankCount += 1;
    }
    return rankCount;
  }

  /**
   * Generate a random list of tags
   */
  generateTags() {
    return getNumberArray(this.tagCount)
      .map(() => getRandomName(randomNumber(MAX_NODE_TAG_COUNT)))
      .filter(unique);
  }

  /**
   * Create list of nodes
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

  getRankNodeCount(rank) {
    const max = MAX_RANK_NODE_COUNT;
    const min = MIN_RANK_NODE_COUNT;
    const p = (this.rankCount - rank) / this.rankCount;
    return randomNumber(p * (max - min) + min);
  }

  getType(rank) {
    if (rank % 2) {
      return 'task';
    }
    if (Math.random() < PARAMETERS_FREQUENCY) {
      return 'parameters';
    }
    return 'data';
  }

  createNode(i, rank, type) {
    const name = this.getNodeName(type);
    const node = {
      id: `${type}/${name}(${rank}-${i})`,
      name,
      full_name: getRandomName(randomNumber(40)),
      type,
      rank,
      layer: this.getLayer(rank)
    };
    if (type === 'data') {
      node.tags = this.getRandomTags();
    }
    return node;
  }

  getNodeName(type) {
    const name = getRandomName(randomNumber(10), ' ');
    return type === 'parameters' ? `parameters_${name}` : name;
  }

  getLayer(rank) {
    const index = Math.floor((rank / this.rankCount) * LAYERS.length);
    return LAYERS[index];
  }

  /**
   * Select a random number of tags from the list of tags
   */
  getRandomTags() {
    return getNumberArray(randomNumber(this.tagCount))
      .map(() => this.tags[randomIndex(this.tags.length)])
      .filter(unique);
  }

  generateEdges() {
    const edges = [];
    const dataNodes = this.nodes.filter(node => node.type === 'data');
    const taskNodes = this.nodes.filter(node => node.type !== 'data');

    taskNodes.forEach(node => {
      const ancestors = dataNodes.filter(d => d.rank < node.rank);
      this.getRandomNodes(ancestors).forEach(source => {
        edges.push({
          source: source.id,
          target: node.id
        });
      });

      const descendants = dataNodes.filter(d => d.rank > node.rank);
      this.getRandomNodes(descendants).forEach(target => {
        edges.push({
          source: node.id,
          target: target.id
        });
      });
    });

    return edges;
  }

  /**
   * Get a random list of nodes to link to
   * algorithm via https://stackoverflow.com/a/19270021/1651713
   * @param {array} nodes List of nodes from which to choose
   */
  getRandomNodes(nodes) {
    let len = nodes.length;
    let connections = randomNumberBetween(
      MIN_CONNECTED_NODES,
      MAX_CONNECTED_NODES
    );
    if (connections > len) {
      return nodes;
    }
    const result = new Array(connections);
    const taken = new Array(len);
    while (connections--) {
      var x = Math.floor(Math.random() * len);
      result[connections] = nodes[x in taken ? taken[x] : x];
      taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
  }

  // Select only nodes that are connected to others
  filterUnconnectedNodes() {
    const findMatchingEdge = node => edge =>
      node.id === edge.source || node.id === edge.target;

    return this.nodes.filter(
      node => this.edges.findIndex(findMatchingEdge(node)) !== -1
    );
  }

  // Select only used tags
  filterUnusedTags() {
    return this.nodes
      .reduce((tags, node) => (node.tags ? tags.concat(node.tags) : tags), [])
      .filter(unique)
      .map(tag => ({ name: tag, id: tag }));
  }

  /**
   * Get a complete JSON schema
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
