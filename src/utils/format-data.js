import { fromJS } from 'immutable';

/**
 * Check whether data is in expected format
 * @param {Object} data - The parsed data input
 * @return {Boolean} True if valid for formatting
 */
const validateInput = data => {
  const { isArray } = Array;
  return isArray(data) && data.every(d => (
    isArray(d.inputs) && isArray(d.outputs) && typeof d.name === 'string' 
  ));
}

/**
 * Get unique, reproducible ID for each edge, based on its nodes
 * @param {Object} edge - An edge datum
 */
export const edgeID = edge => [edge.source, edge.target].join('-');

/**
 * Format raw data for a single snapshot into a usable structure
 * @param {Object} raw - The parsed data straight from the JSON
 * @return {Object} The node, edge and raw data for the chart
 */
const formatSnapshotData = raw => {
  if (!validateInput(raw)) {
    return {};
  }

  const nodes = {
    allIDs: [],
    active: {},
    data: {},
    disabled: {},
    links: {},
    type: {},
    tags: {},
  };
  const edges = {
    allIDs: [],
    active: {},
    data: {},
    sources: {},
    targets: {},
    disabled: {},
  };
  const tags = {
    allIDs: [],
    active: {},
    enabled: {},
  };

  /**
   * Add a new node if it doesn't already exist
   * @param {string} id - Underscore-separated node id
   * @param {string} type - 'data' or 'task'
   * @param {Array} tags - List of associated tags
   */
  const addNode = (name, type, tags = []) => {
    if (nodes.allIDs.includes(name)) {
      return;
    }
    nodes.allIDs.push(name);
    nodes.links[name] = [];
    nodes.tags[name] = tags;
    nodes.type[name] = type;
  };

  /**
   * Create a new link between two nodes and add it to the edges array
   * @param {Object} source - Parent node
   * @param {Object} target - Child node
   */
  const addEdge = (source, target) => {
    const edge = { source, target };
    const id = edgeID(edge);
    edges.sources[id] = source;
    edges.targets[id] = target;
    edges.allIDs.push(id);
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
      addEdge(source, name);

      // Create link between input data nodes and output data nodes (for data view)
      outputs.forEach(target => {
        addEdge(source, target);
      });
    });

    // Create link between task node and output data nodes (for combined view)
    outputs.forEach(target => {
      addEdge(name, target);
    });
  };

  // Iterate through the raw data and create formatted nodes and edges
  raw.forEach(node => {
    createNodes(node);
    createEdges(node);
  });

  /**
   * Add list of linked nodes to each node
   * @param {Object} edge Edge datum
   */
  const getLinkedNodes = ({ source, target }) => {
    if (nodes.type[source] === nodes.type[target]) {
      return;
    }
    const addLink = (a, b) => {
      if (!nodes.links[a].includes(b)) {
        nodes.links[a].push(b);
      }
    };
    addLink(source, target);
    addLink(target, source);
  };

  edges.allIDs.forEach(d => {
    const d1 = {
      source: edges.sources[d],
      target: edges.targets[d],
    };
    getLinkedNodes(d1);

    // Create links between input task nodes and output task nodes (for task view)
    if (nodes.type[d1.source] === 'task') {
      edges.allIDs.forEach(dd => {
        const d2 = {
          source: edges.sources[dd],
          target: edges.targets[dd],
        };
        if (nodes.type[d2.target] === 'task' && d2.source === edges.targets[d]) {
          addEdge(d1.source, d2.target);
        }
      });
    }
  });

  // Generate a formatted list of tags from node data
  nodes.allIDs.forEach(nodeID => {
    nodes.tags[nodeID].forEach(tagID => {
      if (!tags.allIDs.includes(tagID)) {
        tags.allIDs.push(tagID);
      }
    });
  });

  return {
    nodes,
    edges,
    tags
  };
};

/**
 * Format the full list of snapshot data
 * @param {Array} data 
 * @eturn {Object} 
 */
const formatSnapshots = (data) => {
  if (!Array.isArray(data)) {
    return {};
  }

  const formattedData = data.map(({
    json_schema,
    kernel_ai_schema_id,
    created_ts,
    ...pipeline
  }) => Object.assign({}, pipeline, {
    id: String(kernel_ai_schema_id),
    timestamp: Number(created_ts),
    ...formatSnapshotData(json_schema)
  }));

  const snapshots = formattedData.reduce((snapshots, snapshot) => {
    snapshots[snapshot.id] = snapshot;
    return snapshots;
  }, {});

  const allIDs = formattedData
    .sort((a, b) => b.created_ts - a.created_ts)
    .map(d => d.id);
  
  return fromJS({
    snapshots,
    allIDs
  });
};

export default formatSnapshots;
