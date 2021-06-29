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

const renderParameters = (params) => {
  if (!params) {
    return null;
  }
  const pretty_params = JSON.stringify(params, null, 1);
  const parameters = {};
  parameters.name = pretty_params.replaceAll(/[{}"]/g, '');
  parameters.count = parameters.name.split(':').length - 1;
  return parameters;
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
 * Gets metadata for the currently clicked node if any
 */
export const getClickedNodeMetaData = createSelector(
  [
    getClickedNode,
    getGraphNodes,
    (state) => state.node.tags,
    (state) => state.tag.name,
    (state) => state.pipeline,
    (state) => state.node.filepath,
    (state) => state.node.code,
    (state) => state.node.parameters,
    (state) => state.node.plot,
    (state) => state.node.datasetType,
  ],
  (
    nodeId,
    nodes = {},
    nodeTags,
    tagNames,
    pipeline,
    nodeFilepaths,
    nodeCodes,
    nodeParameters,
    nodePlot,
    nodeDatasetTypes
  ) => {
    const node = nodes[nodeId];

    if (!node) {
      return null;
    }

    const metadata = {
      node,
      tags: [...nodeTags[node.id]]
        .map((tagId) => tagNames[tagId])
        .sort(sortAlpha),
      pipeline: pipeline.name[pipeline.active],
      parameters: renderParameters(nodeParameters[node.id]),
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
  }
);
