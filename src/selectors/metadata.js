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
 * Unwrap parameters by extracting the first and only object based on assumption that server returns object with additional nesting.
 *  @param {?object} parameters The parameters as returned from the server
 *  @returns {object} The unwrapped parameters
 */
const unwrapParameters = (parameters) => {
  if (!parameters || !parameters[Object.keys(parameters)[0]]) {
    return {};
  }
  return parameters[Object.keys(parameters)[0]];
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
    (state) => state.node.runCommand,
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
    nodeDatasetTypes,
    nodeRunCommand
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
      parameters: unwrapParameters(nodeParameters[node.id]),
      runCommand: nodeRunCommand[node.id],
      code: nodeCodes[node.id],
      filepath: nodeFilepaths[node.id],
      plot: nodePlot[node.id],
      datasetType: nodeDatasetTypes[node.id],
    };

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
