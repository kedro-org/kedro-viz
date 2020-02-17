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
  if (state.nodeName[id]) {
    return;
  }
  state.nodes.push(id);
  state.nodeName[id] = node.name;
  state.nodeFullName[id] = node.full_name || node.name;
  state.nodeType[id] = node.type;
  state.nodeIsParam[id] = node.type === 'parameters';
  state.nodeTags[id] = node.tags || [];
};

/**
 * Create a new link between two nodes and add it to the edges array
 * @param {Object} source - Parent node
 * @param {Object} target - Child node
 */
const addEdge = state => ({ source, target }) => {
  const id = getEdgeID(source, target);
  if (state.edges.includes(id)) {
    return;
  }
  state.edges.push(id);
  state.edgeSources[id] = source;
  state.edgeTargets[id] = target;
};

/**
 * Add a new Tag if it doesn't already exist
 * @param {string} name - Default node name
 */
const addTag = state => tag => {
  const { id } = tag;
  state.tags.push(id);
  state.tagName[id] = tag.name;
};

/**
 * Convert the pipeline data into a normalised state object
 * @param {Object} data Raw unformatted data input
 * @return {Object} Formatted, normalized state
 */
const formatData = data => {
  const state = getInitialPipelineState();

  if (validateInput(data)) {
    state.id = data.schema_id;
    data.nodes.forEach(addNode(state));
    data.edges.forEach(addEdge(state));
    data.tags.forEach(addTag(state));
  }

  return state;
};

export default formatData;
