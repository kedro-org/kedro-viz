//--- Config variables ---//

const DATA_NODE_COUNT = 30;
const LOREM_IPSUM = 'lorem ipsum dolor sit amet consectetur adipiscing elit vestibulum id turpis nunc nulla vitae diam dignissim fermentum elit sit amet viverra libero quisque condimentum pellentesque convallis sed consequat neque ac rhoncus finibus'.split(' ');
const MAX_CONNECTED_NODES = 4;
const MAX_LAYER_COUNT = 20;
const MAX_MESSAGE_WORD_LENGTH = 15;
const MAX_NODE_TAG_COUNT = 5;
const MAX_SNAPSHOT_COUNT = 40;
const MAX_TAG_COUNT = 20;
const MAX_TIMESTAMP_OFFSET = 9999999999;
const PARAMETERS_FREQUENCY = 0.05;
const TASK_NODE_COUNT = 10;

//--- Utility functions ---//

// Get a random array of numbers
const getArray = n => Array.from(Array(n).keys());

// Get a random number between 0 to n-1, inclusive
const randomIndex = n => Math.floor(Math.random() * n);

// Get a random number between 1 to n, inclusive
const randomNumber = n => Math.ceil(Math.random() * n);

// Get a random datum from an array
const getRandom = range => range[randomIndex(range.length)];

// Get a random datum from an array that matches a filter condition
const getRandomMatch = (array, condition) => getRandom(array.filter(condition));

// Generate a random name
const getRandomName = (n, join = '_') => getArray(n)
  .map(() => getRandom(LOREM_IPSUM))
  .join(join);

// Filter duplicate values from an array
const unique = (d, i, arr) => arr.indexOf(d) === i;

/**
 * Generate a random pipeline snapshot dataset
 */
class Snapshot {
  constructor() {
    this.CONNECTION_COUNT = randomNumber(MAX_CONNECTED_NODES);
    this.LAYER_COUNT = randomNumber(MAX_LAYER_COUNT);
    this.TAG_COUNT = randomNumber(MAX_TAG_COUNT);
    this.nodes = this.getNodes();
    this.tags = this.generateTags();
  }

  /**
   * Generate a name for each node.
   * Put 'parameters_' in front of 1 in 20.
   */
  getRandomNodeName() {
    const params = Math.random() < PARAMETERS_FREQUENCY ? 'parameters_' : '';
    const name = getRandomName(randomNumber(10));
    return params + name;
  }

  /**
   * Generate a list of nodes
   * @param {number} count The number of nodes to generate
   * @param {Function} getLayer A callback to create a random layer number
   */
  generateNodeList(count, getLayer) {
    return getArray(count)
      .map(this.getRandomNodeName)
      .filter(unique)
      .map(id => ({
        id,
        layer: getLayer()
      }));
  }

  /**
   * Get lists of both data and task nodes
   */
  getNodes() {
    return {
      data: this.generateNodeList(
        DATA_NODE_COUNT,
        () => randomIndex(this.LAYER_COUNT + 1)
      ),
      task: this.generateNodeList(
        TASK_NODE_COUNT,
        () => randomIndex(this.LAYER_COUNT) + 0.5
      ),
    };
  }

  /**
   * Generate a random list of tags
   */
  generateTags() {
    return getArray(this.TAG_COUNT)
      .map(() => getRandomName(randomNumber(MAX_NODE_TAG_COUNT)))
      .filter(unique);
  }

  /**
   * Select a random number of tags from the list of tags
   */
  getRandomTags() {
    return getArray(randomNumber(this.TAG_COUNT))
      .map(() => this.tags[randomIndex(this.tags.length)])
      .filter(unique);
  }

  /**
   * Get connected data nodes for each task node
   * @param {Function} condition Determine order of precedence
   */
  getConnectedNodes(condition) {
    return getArray(this.CONNECTION_COUNT)
      .map(() => getRandomMatch(this.nodes.data, condition))
      .filter(Boolean)
      .map(d => d.id)
      .filter(unique);
  }

  /**
   * Get a complete JSON schema
   */
  getSchema() {
    return this.nodes.task.map(node => ({
      inputs: this.getConnectedNodes(d => d.layer < node.layer),
      name: node.id,
      tags: this.getRandomTags(),
      outputs: this.getConnectedNodes(d => d.layer > node.layer)
    }));
  }

  /**
   * Generate the full snapshot datum, including ID, timestamp,
   * random message and JSON schema
   */
  getDatum() {
    return {
      kernel_ai_schema_id: randomNumber(999999999999999),
      message: getRandomName(randomNumber(MAX_MESSAGE_WORD_LENGTH), ' '),
      created_ts: new Date().getTime() - randomNumber(MAX_TIMESTAMP_OFFSET),
      json_schema: this.getSchema()
    };
  }
};

const generateRandomHistory = () =>
  getArray(randomNumber(MAX_SNAPSHOT_COUNT))
    .map(() => new Snapshot().getDatum())
    .sort((a, b) => b.created_ts - a.created_ts);

export default generateRandomHistory;
