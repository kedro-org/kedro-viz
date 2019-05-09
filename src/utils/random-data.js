import {
  getNumberArray,
  randomIndex,
  randomNumber,
  getRandomMatch,
  getRandomName,
  unique
} from './index';

//--- Config variables ---//

const DATA_NODE_COUNT = 30;
const MAX_CONNECTED_NODES = 4;
const MAX_LAYER_COUNT = 20;
const MAX_MESSAGE_WORD_LENGTH = 15;
const MAX_NODE_TAG_COUNT = 5;
const MAX_SNAPSHOT_COUNT = 40;
const MAX_TAG_COUNT = 20;
const MAX_TIMESTAMP_OFFSET = 9999999999;
const PARAMETERS_FREQUENCY = 0.05;
const TASK_NODE_COUNT = 10;

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
   * @param {number} paramFreq How often nodes should include 'parameters' in their name
   */
  getRandomNodeName(paramFreq) {
    const name = getRandomName(randomNumber(10));
    const params = Math.random() < paramFreq ? 'parameters_' : '';
    return params + name;
  }

  /**
   * Generate a list of nodes
   * @param {number} count The number of nodes to generate
   * @param {Function} getLayer A callback to create a random layer number
   * @param {number} paramFreq How often nodes should include 'parameters' in their name
   */
  generateNodeList(count, getLayer, paramFreq) {
    return getNumberArray(count)
      .map(() => this.getRandomNodeName(paramFreq))
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
        () => randomIndex(this.LAYER_COUNT + 1),
        PARAMETERS_FREQUENCY
      ),
      task: this.generateNodeList(
        TASK_NODE_COUNT,
        () => randomIndex(this.LAYER_COUNT) + 0.5,
        0
      )
    };
  }

  /**
   * Generate a random list of tags
   */
  generateTags() {
    return getNumberArray(this.TAG_COUNT)
      .map(() => getRandomName(randomNumber(MAX_NODE_TAG_COUNT)))
      .filter(unique);
  }

  /**
   * Select a random number of tags from the list of tags
   */
  getRandomTags() {
    return getNumberArray(randomNumber(this.TAG_COUNT))
      .map(() => this.tags[randomIndex(this.tags.length)])
      .filter(unique);
  }

  /**
   * Get connected data nodes for each task node
   * @param {Function} condition Determine order of precedence
   */
  getConnectedNodes(condition) {
    return getNumberArray(this.CONNECTION_COUNT)
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
      schema_id: randomNumber(999999999999999),
      message: getRandomName(randomNumber(MAX_MESSAGE_WORD_LENGTH), ' '),
      created_ts: new Date().getTime() - randomNumber(MAX_TIMESTAMP_OFFSET),
      json_schema: this.getSchema()
    };
  }
}

const generateRandomHistory = () =>
  getNumberArray(randomNumber(MAX_SNAPSHOT_COUNT))
    .map(() => new Snapshot().getDatum())
    .sort((a, b) => b.created_ts - a.created_ts);

export default generateRandomHistory;
