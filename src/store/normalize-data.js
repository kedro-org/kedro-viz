import { getInitialPipelineState } from '../store/initial-state';
import { arrayToObject } from '../utils';

/**
 * Check whether data is in expected format
 * @param {Object} data - The parsed data input
 * @return {Boolean} True if valid for formatting
 */
const validateInput = data => {
  if (!data) {
    // Data may still be loading, or has not been supplied
    return false;
  }
  if (!Array.isArray(data.edges) || !Array.isArray(data.nodes)) {
    if (typeof jest === 'undefined') {
      console.error(
        'Invalid data input: Please ensure that your pipeline data includes arrays of nodes and edges',
        data
      );
    }
    return false;
  }
  return true;
};

/**
 * Get unique, reproducible ID for each edge, based on its nodes
 * @param {Object} source - Name and type of the source node
 * @param {Object} target - Name and type of the target node
 */
const createEdgeID = (source, target) => [source, target].join('|');

/**
 * Add a new pipeline
 * @param {string} pipeline.id - Unique ID
 * @param {string} pipeline.name - Pipeline name
 */
const addPipeline = state => pipeline => {
  const { id } = pipeline;
  if (state.pipeline.name[id]) {
    return;
  }
  state.pipeline.ids.push(id);
  state.pipeline.name[id] = pipeline.name;
};

/**
 * Add a new node if it doesn't already exist
 * @param {string} name - Default node name
 * @param {string} type - 'data' or 'task'
 * @param {Array} tags - List of associated tags
 */
const addNode = state => node => {
  const { id } = node;
  if (state.node.name[id]) {
    return;
  }
  state.node.ids.push(id);
  state.node.name[id] = node.name;
  state.node.fullName[id] = node.full_name || node.name;
  state.node.type[id] = node.type;
  state.node.layer[id] = node.layer;
  state.node.pipelines[id] = node.pipelines
    ? arrayToObject(node.pipelines, () => true)
    : {};
  state.node.isParam[id] = node.type === 'parameters';
  state.node.tags[id] = node.tags || [];
};

/**
 * Create a new link between two nodes and add it to the edges array
 * @param {Object} source - Parent node
 * @param {Object} target - Child node
 */
const addEdge = state => ({ source, target }) => {
  const id = createEdgeID(source, target);
  if (state.edge.ids.includes(id)) {
    return;
  }
  state.edge.ids.push(id);
  state.edge.sources[id] = source;
  state.edge.targets[id] = target;
};

/**
 * Add a new Tag if it doesn't already exist
 * @param {Object} tag - Tag object
 */
const addTag = state => tag => {
  const { id } = tag;
  state.tag.ids.push(id);
  state.tag.name[id] = tag.name;
};

/**
 * Add a new Layer if it doesn't already exist
 * @param {Object} layer - Layer object
 */
const addLayer = state => layer => {
  // using layer name as both layerId and name.
  // It futureproofs it if we need a separate layer ID in the future.
  state.layer.ids.push(layer);
  state.layer.name[layer] = layer;
};

/**
 * Convert the pipeline data into a normalized state object
 * @param {Object} data Raw unformatted data input
 * @return {Object} Formatted, normalized state
 */
const normalizeData = data => {
  const state = getInitialPipelineState();

  if (!validateInput(data)) {
    return state;
  }

  if (data.schema_id) {
    state.id = data.schema_id;
  }
  data.nodes.forEach(addNode(state));
  data.edges.forEach(addEdge(state));
  if (data.pipelines) {
    data.pipelines.forEach(addPipeline(state));
    if (state.pipeline.ids.length) {
      state.pipeline.active = state.pipeline.ids[0];
    }
  }
  if (data.tags) {
    data.tags.forEach(addTag(state));
  }
  if (data.layers) {
    data.layers.forEach(addLayer(state));
  }

  return state;
};

export default normalizeData;
