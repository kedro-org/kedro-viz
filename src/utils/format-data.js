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
export const getEdgeID = (source, target) => [source, target].join('|');

/**
 * Format the full list of snapshot data
 * @param {Array} data
 * @eturn {Object}
 */
const formatData = data => {
  if (!validateInput(data) && !Array.isArray(data.snapshots)) {
    return {};
  }

  // Nodes
  const nodes = [];
  const nodeID = {};
  const nodeName = {};
  const nodeFullName = {};
  const nodeType = {};
  const nodeIsParam = {};
  const nodeTags = {};
  // Edges
  const edges = [];
  const edgeSources = {};
  const edgeTargets = {};
  // Tags
  const tags = [];
  const tagName = {};

  /**
   * Add a new node if it doesn't already exist
   * @param {string} name - Default node name
   * @param {string} type - 'data' or 'task'
   * @param {Array} tags - List of associated tags
   */
  const addNode = node => {
    const { id } = node;
    if (nodeName[id]) {
      return;
    }
    nodes.push(id);
    nodeID[id] = id;
    nodeName[id] = node.name;
    nodeFullName[id] = node.full_name;
    nodeType[id] = node.type;
    nodeIsParam[id] = Boolean(node.is_parameters);
    nodeTags[id] = node.tags || [];
  };

  /**
   * Create a new link between two nodes and add it to the edges array
   * @param {Object} source - Parent node
   * @param {Object} target - Child node
   */
  const addEdge = ({ source, target }) => {
    const id = getEdgeID(source, target);
    if (edges.includes(id)) {
      return;
    }
    edges.push(id);
    edgeSources[id] = source;
    edgeTargets[id] = target;
  };

  /**
   * Add a new Tag if it doesn't already exist
   * @param {string} name - Default node name
   */
  const addTag = tag => {
    const { id } = tag;
    tags.push(id);
    tagName[id] = tag.name;
  };

  const rawData = data.snapshots ? data.snapshots[0] : data;

  if (validateInput(rawData)) {
    // Begin formatting
    rawData.nodes.forEach(addNode);
    rawData.edges.forEach(addEdge);
    rawData.tags.forEach(addTag);
  }

  return {
    id: rawData ? rawData.schema_id : '',
    nodes,
    nodeName,
    nodeFullName,
    nodeActive: {},
    nodeDisabled: {},
    nodeFocused: null,
    nodeType,
    nodeIsParam,
    nodeTags,
    edges,
    edgeActive: {},
    edgeSources,
    edgeTargets,
    edgeDisabled: {},
    tags,
    tagName,
    tagActive: {},
    tagEnabled: {}
  };
};

export default formatData;
