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
    (state) => state.node.inputs,
    (state) => state.node.outputs,
    (state) => state.node.code,
    (state) => state.node.parameters,
    (state) => state.node.plot,
    (state) => state.node.trackingData,
    (state) => state.node.datasetType,
    (state) => state.node.originalType,
    (state) => state.node.transcodedTypes,
    (state) => state.node.runCommand,
  ],
  (
    nodeId,
    nodes = {},
    nodeTags,
    tagNames,
    pipeline,
    nodeFilepaths,
    nodeInputs,
    nodeOutputs,
    nodeCodes,
    nodeParameters,
    nodePlot,
    nodeTrackingData,
    nodeDatasetTypes,
    nodeOriginalTypes,
    nodeTranscodedTypes,
    nodeRunCommand
  ) => {
    const node = nodes[nodeId];
    if (!node) {
      return null;
    }
    //rounding of tracking data
    nodeTrackingData[node.id] &&
      Object.entries(nodeTrackingData[node.id]).forEach(([key, value]) => {
        nodeTrackingData[node.id][key] = Math.round(value * 100) / 100;
      });

    const metadata = {
      node,
      tags: [...nodeTags[node.id]]
        .map((tagId) => tagNames[tagId])
        .sort(sortAlpha),
      pipeline: pipeline.name[pipeline.active],
      parameters: nodeParameters[node.id],
      runCommand: nodeRunCommand[node.id],
      code: nodeCodes[node.id],
      filepath: nodeFilepaths[node.id],
      plot: nodePlot[node.id],
      trackingData: nodeTrackingData[node.id],
      datasetType: nodeDatasetTypes[node.id],
      originalType: nodeOriginalTypes[node.id],
      transcodedTypes: nodeTranscodedTypes[node.id],
      inputs: nodeInputs[node.id],
      outputs: nodeOutputs[node.id],
    };
    return metadata;
  }
);
