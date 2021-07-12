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
