import { createSelector } from 'reselect';
import { getGraphNodes } from './nodes';

const getClickedNode = (state) => state.node.clicked;

/**
 * Comparison for sorting alphabetically by name, otherwise by value
 */
const sortAlpha = (a, b) => (a.name || a).localeCompare(b.name || b);

/**
 * Returns true if metadata sidebar is visible
 */
export const getVisibleMetaSidebar = createSelector(
  [getClickedNode],
  (nodeClicked) => Boolean(nodeClicked)
);

/**
 * Templates for run commands
 */
const runCommandTemplates = {
  data: (name) => `kedro run --to-inputs ${name}`,
  task: (name) => `kedro run --to-nodes ${name}`,
};

/**
 * Returns run command for the node, if applicable to the node type
 * @param {object} node The node
 * @returns {?string} The run command for the node, if applicable
 */
const getRunCommand = (node) => {
  const template = runCommandTemplates[node.type];
  return template ? template(node.fullName) : null;
};

/**
 * Gets metadata for the nodes
 */

export const getNodeMetaData = (nodeId, nodes, state) => {
  const node = nodes[nodeId];
  const nodeTags = state.node.tags;
  const tagNames = state.tag.name;
  const pipeline = state.pipeline;
  const nodeFilepaths = state.node.filepath;
  const nodeCodes = state.node.code;
  const nodeParameters = state.node.parameters;
  const nodePlot = state.node.plot;
  const nodeDatasetTypes = state.node.datasetType;

  const parameters =
    nodeParameters[node.id] &&
    Object.entries(nodeParameters[node.id]).map(
      ([key, value]) => `${key}: ${value}`
    );

  const metadata = {
    node,
    tags: [...nodeTags[node.id]]
      .map((tagId) => tagNames[tagId])
      .sort(sortAlpha),
    pipeline: pipeline.name[pipeline.active],
    parameters,
    runCommand: getRunCommand(node),
    code: nodeCodes[node.id],
    filepath: nodeFilepaths[node.id],
    plot: nodePlot[node.id],
    datasetType: nodeDatasetTypes[node.id],
  };

  // Note: node.sources node.targets require oldgraph enabled
  if (node.sources && node.targets) {
    metadata.inputs = node.sources
      .map((edge) => nodes[edge.source])
      .sort(sortAlpha);
    metadata.outputs = node.targets
      .map((edge) => nodes[edge.target])
      .sort(sortAlpha);
  }
  return metadata;
};

/**
 * Gets metadata for the current clicked node if any
 */
export const getClickedNodeMetaData = createSelector(
  [getClickedNode, getGraphNodes, (state) => state],
  (nodeID, nodes, state) => {
    if (!nodeID) {
      return null;
    }
    return getNodeMetaData(nodeID, nodes, state);
  }
);
