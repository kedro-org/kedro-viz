import { getInitialPipelineState } from '../store/initial-state';
/**
 * Check whether data is in expected format
 * @param {Object} data - The parsed data input
 * @return {Boolean} True if valid for formatting
 */
const validateInput = data => {
  const { isArray } = Array;
  return (
    data && isArray(data.edges) && isArray(data.nodes) && isArray(data.tags)
  );
};

/**
 * Get unique, reproducible ID for each edge, based on its nodes
 * @param {Object} source - Name and type of the source node
 * @param {Object} target - Name and type of the target node
 */
const getEdgeID = (source, target) => [source, target].join('|');

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
  state.node.isParam[id] = node.type === 'parameters';
  state.node.tags[id] = node.tags || [];
};

/**
 * Create a new link between two nodes and add it to the edges array
 * @param {Object} source - Parent node
 * @param {Object} target - Child node
 */
const addEdge = state => ({ source, target }) => {
  const id = getEdgeID(source, target);
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
  const { id, name } = layer;
  state.layer.ids.push(id);
  state.layer.name[id] = name;
};

/**
 * Convert the pipeline data into a normalised state object
 * @param {Object} data Raw unformatted data input
 * @return {Object} Formatted, normalized state
 */
const formatData = data => {
  const state = getInitialPipelineState();

  if (validateInput(data)) {
    if (data.schema_id) {
      state.id = data.schema_id;
    }
    data.nodes.forEach(addNode(state));
    data.edges.forEach(addEdge(state));
    if (data.tags) {
      data.tags.forEach(addTag(state));
    }
    if (data.layers) {
      data.layers.forEach(addLayer(state));
    }
  }

  return state;
};

export default formatData;
