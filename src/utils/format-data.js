/**
 * Check whether data is in expected format
 * @param {Object} data - The parsed data input
 * @return {Boolean} True if valid for formatting
 */
const validateInput = data => {
  const { isArray } = Array;
  return isArray(data.edges) && isArray(data.nodes);
};

/**
 * Get unique, reproducible ID for each node
 * @param {string} snapshot - Unique snapshot ID
 * @param {string} nodeName - The original name for the node
 * @param {string} nodeType - The node's type
 */
export const getNodeID = (snapshotID, nodeID) => `${snapshotID}/${nodeID}`;

/**
 * Get unique, reproducible ID for each edge, based on its nodes
 * @param {string} snapshotID - Unique snapshot ID
 * @param {Object} source - Name and type of the source node
 * @param {Object} target - Name and type of the target node
 */
export const getEdgeID = (snapshotID, source, target) =>
  [source, target].map(nodeID => getNodeID(snapshotID, nodeID)).join('|');

/**
 * Get unique, reproducible ID for each tag
 * @param {string} snapshot - Unique snapshot ID
 * @param {Object} tagID - A tag ID
 */
export const getTagID = (snapshotID, tagID) => `${snapshotID}/${tagID}`;

/**
 * Format the full list of snapshot data
 * @param {Array} data
 * @eturn {Object}
 */
const formatSnapshots = data => {
  if (!Array.isArray(data.snapshots)) {
    return {};
  }

  // Snapshots
  const snapshotIDs = [];
  const snapshotSchema = {};
  const snapshotMessage = {};
  const snapshotTimestamp = {};
  const snapshotNodes = {};
  const snapshotEdges = {};
  const snapshotTags = {};
  // Nodes
  const nodeID = {};
  const nodeName = {};
  const nodeFullName = {};
  const nodeType = {};
  const nodeIsParam = {};
  const nodeTags = {};
  // Edges
  const edgeSources = {};
  const edgeTargets = {};
  // Tags
  const tagName = {};

  /**
   * Format raw data for a single snapshot into a usable structure
   * @param {string} snapshotID - Unique snapshot ID
   * @param {Object} raw - The parsed data straight from the JSON
   * @return {Object} The node, edge and raw data for the chart
   */
  const formatSnapshotData = (snapshotID, rawSnapshot) => {
    if (!validateInput(rawSnapshot)) {
      return;
    }

    snapshotNodes[snapshotID] = [];
    snapshotEdges[snapshotID] = [];
    snapshotTags[snapshotID] = [];

    /**
     * Add a new node if it doesn't already exist
     * @param {string} name - Default node name
     * @param {string} type - 'data' or 'task'
     * @param {Array} tags - List of associated tags
     */
    const addNode = node => {
      const id = getNodeID(snapshotID, node.id);
      if (nodeName[id]) {
        return;
      }
      snapshotNodes[snapshotID].push(id);
      nodeID[id] = id;
      nodeName[id] = node.name;
      nodeFullName[id] = node.full_name;
      nodeType[id] = node.type;
      nodeIsParam[id] = Boolean(node.is_parameters);
      nodeTags[id] = (node.tags || []).map(tagID =>
        getTagID(snapshotID, tagID)
      );
    };

    /**
     * Create a new link between two nodes and add it to the edges array
     * @param {Object} source - Parent node
     * @param {Object} target - Child node
     */
    const addEdge = ({ source, target }) => {
      const id = getEdgeID(snapshotID, source, target);
      if (snapshotEdges[snapshotID].includes(id)) {
        return;
      }
      snapshotEdges[snapshotID].push(id);
      edgeSources[id] = getNodeID(snapshotID, source);
      edgeTargets[id] = getNodeID(snapshotID, target);
    };

    /**
     * Add a new Tag if it doesn't already exist
     * @param {string} name - Default node name
     */
    const addTag = tag => {
      const id = getTagID(snapshotID, tag.id);
      snapshotTags[snapshotID].push(id);
      tagName[id] = tag.name;
    };

    // Begin formatting
    rawSnapshot.nodes.forEach(addNode);
    rawSnapshot.edges.forEach(addEdge);
    rawSnapshot.tags.forEach(addTag);
  };

  data.snapshots.forEach(snapshot => {
    const id = String(snapshot.schema_id || '');
    snapshotIDs.push(id);
    snapshotSchema[id] = snapshot;
    snapshotTimestamp[id] = Number(snapshot.created_ts);
    snapshotMessage[id] = snapshot.message;
    formatSnapshotData(id, snapshot);
  });

  const snapshots = {
    snapshotIDs: snapshotIDs.sort(
      (a, b) => snapshotTimestamp[b] - snapshotTimestamp[a]
    ),
    snapshotSchema,
    snapshotMessage,
    snapshotTimestamp,
    snapshotNodes,
    snapshotEdges,
    snapshotTags,
    nodeName,
    nodeFullName,
    nodeActive: {},
    nodeDisabled: {},
    nodeType,
    nodeIsParam,
    nodeTags,
    edgeActive: {},
    edgeSources,
    edgeTargets,
    edgeDisabled: {},
    tagName,
    tagActive: {},
    tagEnabled: {}
  };

  return snapshots;
};

export default formatSnapshots;
