import { json } from 'd3-fetch';

/**
 * Format raw data into a usable structure
 * @param {Object} raw - The parsed data straight from the JSON file
 * @return {Object} The node, edge and raw data for the chart
 */
const formatData = raw => {
  const nodes = [];
  const edges = [];

  /**
   * Create a new nicely-formatted node object
   * @param {string} id - Underscore-separated node id
   * @param {string} type - 'data' or 'task'
   * @return {Object} The node datum
   */
  const formatNode = (id, type) => ({
    id,
    name: id.replace(/_/g, ' '),
    type
  });

  /**
   * Get a reference to the formatted node datum
   * @param {string} id - Underscore-separated node id
   */
  const findNode = id => nodes.find(d => d.id === id);

  /**
   * Add a new node if it doesn't already exist
   * @param {string} type - 'data' or 'task'
   * @param {string} id - Underscore-separated node id
   */
  const addNode = type => id => {
    if (findNode(id)) {
      return;
    }
    nodes.push(formatNode(id, type));
  };

  /**
   * Create a new link between two nodes and add it to the edges array
   * @param {Object} source - Parent node
   * @param {Object} target - Child node
   */
  const addEdge = (source, target) => {
    edges.push({ source, target });
  };

  /**
   * Create data and task nodes for the inputs/outputs etc in the raw dataset
   * @param {Object} node
   */
  const createNodes = node => {
    addNode('task')(node.name);
    node.inputs.forEach(addNode('data'));
    node.outputs.forEach(addNode('data'));
  };

  /**
   * Create links for the combined and data views
   * @param {string} name - The task node name
   * @param {Array} inputs - A list of data nodes that link to this task
   * @param {Array} outputs - A list of data nodes linked to from this task
   */
  const createEdges = ({ name, inputs, outputs }) => {
    const node = findNode(name);

    inputs.forEach(d => {
      // Create link between input data nodes and task node (for combined view)
      const source = findNode(d);
      addEdge(source, node);

      // Create link between input data nodes and output data nodes (for data view)
      outputs.forEach(target => {
        addEdge(source, findNode(target));
      });
    });

    // Create link between task node and output data nodes (for combined view)
    outputs.forEach(target => {
      addEdge(node, findNode(target));
    });
  };

  // Iterate through the raw data and create formatted nodes and edges
  raw.forEach(node => {
    createNodes(node);
    createEdges(node);
  });

  // Create links between input task nodes and output task nodes (for task view)
  edges.forEach(d => {
    if (d.source.type === 'task') {
      edges.forEach(dd => {
        if (dd.target.type === 'task' && dd.source.id === d.target.id) {
          addEdge(d.source, dd.target);
        }
      });
    }
  });

  // Sort nodes alphabetically
  nodes.sort((a, b) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });

  return {
    raw,
    nodes,
    edges
  };
};

/**
 * Load JSON using d3-fetch
 */
const fetchData = () => json('/data/data.json').then(formatData);

export default fetchData;
