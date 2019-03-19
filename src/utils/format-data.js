/**
 * Check whether data is in expected format
 * @param {Object} data - The parsed data input
 * @return {Boolean} True if valid for formatting
 */
const validateInput = data => {
  const { isArray } = Array;
  return (
    isArray(data) &&
    data.every(
      d => isArray(d.inputs) && isArray(d.outputs) && typeof d.name === 'string'
    )
  );
};

/**
 * Get unique, reproducible ID for each node
 * @param {string} snapshot - Unique snapshot ID
 * @param {string} nodeName - The original name for the node
 * @param {string} nodeType - The node's type
 */
export const getNodeID = (snapshotID, nodeName, nodeType) =>
  `${snapshotID}/${nodeName}-${nodeType}`;

/**
 * Get unique, reproducible ID for each edge, based on its nodes
 * @param {string} snapshotID - Unique snapshot ID
 * @param {Object} source - Name and type of the source node
 * @param {Object} target - Name and type of the target node
 */
export const getEdgeID = (snapshotID, source, target) =>
  [source, target]
    .map(node => getNodeID(snapshotID, node.name, node.type))
    .join('|');

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
  if (!Array.isArray(data)) {
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
  const nodeType = {};
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
    snapshotNodes[snapshotID] = [];
    snapshotEdges[snapshotID] = [];
    snapshotTags[snapshotID] = [];

    /**
     * Add a new node if it doesn't already exist
     * @param {string} name - Default node name
     * @param {string} type - 'data' or 'task'
     * @param {Array} tags - List of associated tags
     */
    const addNode = (name, type, tags = []) => {
      const id = getNodeID(snapshotID, name, type);
      if (nodeName[id]) {
        return;
      }
      snapshotNodes[snapshotID].push(id);
      nodeID[id] = name;
      nodeName[id] = name.replace(/_/g, ' ');
      nodeType[id] = type;
      if (!nodeTags[id]) {
        nodeTags[id] = [];
      }
      tags.forEach(tag => addTag(tag, id));
    };

    /**
     * Create a new link between two nodes and add it to the edges array
     * @param {Object} source - Parent node
     * @param {Object} target - Child node
     */
    const addEdge = (source, target) => {
      const id = getEdgeID(snapshotID, source, target);
      if (snapshotEdges[snapshotID].includes(id)) {
        return;
      }
      snapshotEdges[snapshotID].push(id);
      edgeSources[id] = getNodeID(snapshotID, source.name, source.type);
      edgeTargets[id] = getNodeID(snapshotID, target.name, target.type);
    };

    /**
     * Add a new Tag if it doesn't already exist
     * @param {string} name - Default node name
     */
    const addTag = (name, nodeID) => {
      const id = getTagID(snapshotID, name);
      if (!nodeTags[nodeID].includes(id)) {
        nodeTags[nodeID].push(id);
      }
      if (!tagName[id]) {
        snapshotTags[snapshotID].push(id);
        tagName[id] = name.replace(/_/g, ' ');
      }
    };

    /**
     * Create data and task nodes for the inputs/outputs etc in the raw dataset
     * @param {Object} node
     */
    const createNodes = node => {
      addNode(node.name, 'task', node.tags);
      node.inputs.forEach(name => addNode(name, 'data'));
      node.outputs.forEach(name => addNode(name, 'data'));
    };

    /**
     * Create links for the combined and data views
     * @param {string} name - The task node name
     * @param {Array} inputs - A list of data nodes that link to this task
     * @param {Array} outputs - A list of data nodes linked to from this task
     */
    const createEdges = ({ name, inputs, outputs }) => {
      inputs.forEach(source => {
        // Create link between input data nodes and task node (for combined view)
        addEdge({ name: source, type: 'data' }, { name: name, type: 'task' });

        // Create link between input data nodes and output data nodes (for data view)
        outputs.forEach(target => {
          addEdge(
            { name: source, type: 'data' },
            { name: target, type: 'data' }
          );
        });
      });

      // Create link between task node and output data nodes (for combined view)
      outputs.forEach(target => {
        addEdge({ name: name, type: 'task' }, { name: target, type: 'data' });
      });
    };

    /**
     * Copy tags from task to data node, and filter duplicates
     * @param {string} a Node ID
     * @param {string} b Node ID
     */
    const copyTags = (a, b) => {
      nodeTags[a] = nodeTags[a]
        .concat(nodeTags[b])
        .filter((d, i, arr) => arr.indexOf(d) === i);
    };

    /**
     * Add list of linked nodes to each node
     * @param {Object} edge Edge datum
     */
    const getLinkedNodeTags = ({ source, target }) => {
      if (nodeType[source] === nodeType[target]) {
        return;
      }
      if (nodeType[source] === 'task') {
        copyTags(target, source);
      } else {
        copyTags(source, target);
      }
    };

    /**
     * Iterate through the raw data and create initial set formatted nodes and edges
     */
    const generatePreliminaryData = () => {
      rawSnapshot.forEach(node => {
        createNodes(node);
        createEdges(node);
      });
    };

    /**
     * Get links between tagged nodes, and between task nodes
     */
    const generateAdditionalLinks = () => {
      snapshotEdges[snapshotID].forEach(d => {
        const d1 = {
          source: edgeSources[d],
          target: edgeTargets[d]
        };
        getLinkedNodeTags(d1);

        // Create links between input task nodes and output task nodes (for task view)
        if (nodeType[d1.source] === 'task') {
          snapshotEdges[snapshotID].forEach(dd => {
            const d2 = {
              source: edgeSources[dd],
              target: edgeTargets[dd]
            };
            if (nodeType[d2.target] === 'task' && d2.source === d1.target) {
              addEdge(
                { name: nodeID[d1.source], type: 'task' },
                { name: nodeID[d2.target], type: 'task' }
              );
            }
          });
        }
      });
    };

    /**
     * Generate a formatted list of tags from node data
     */
    const generateTags = () => {
      snapshotNodes[snapshotID].forEach(nodeID => {
        nodeTags[nodeID].forEach(tagID => {
          if (!snapshotTags[snapshotID]) {
            snapshotTags[snapshotID] = [];
          }
          if (!snapshotTags[snapshotID].includes(tagID)) {
            snapshotTags[snapshotID].push(tagID);
          }
        });
      });
    };

    // Begin formatting
    if (validateInput(rawSnapshot)) {
      generatePreliminaryData();
      generateAdditionalLinks();
      generateTags();
    }
  };

  data.forEach(d => {
    const id = String(d.kernel_ai_schema_id);
    snapshotIDs.push(id);
    snapshotSchema[id] = d.json_schema;
    snapshotTimestamp[id] = Number(d.created_ts);
    snapshotMessage[id] = d.message;
    formatSnapshotData(id, d.json_schema);
  });

  const snapshots = {
    snapshotIDs: snapshotIDs.sort(
      (a, b) => snapshotTimestamp[b] - snapshotTimestamp[a]
    ),
    snapshotSchema: snapshotSchema,
    snapshotMessage: snapshotMessage,
    snapshotTimestamp: snapshotTimestamp,
    snapshotNodes: snapshotNodes,
    snapshotEdges: snapshotEdges,
    snapshotTags: snapshotTags,
    nodeName: nodeName,
    nodeActive: {},
    nodeDisabled: {},
    nodeType: nodeType,
    nodeTags: nodeTags,
    edgeActive: {},
    edgeSources: edgeSources,
    edgeTargets: edgeTargets,
    edgeDisabled: {},
    tagName: tagName,
    tagActive: {},
    tagEnabled: {}
  };

  return snapshots;
};

export default formatSnapshots;
