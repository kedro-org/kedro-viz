import { createSelector } from 'reselect';
import { getNodeLabel, getNodeFullName, getNodeName } from './nodes';
import { prettifyName, stripNamespace } from '../utils';

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
    getNodeLabel,
    getNodeFullName,
    getNodeName,
    (state) => state.node.type,
    (state) => state.node.tags,
    (state) => state.tag.name,
    (state) => state.pipeline,
    (state) => state.node.filepath,
    (state) => state.node.inputs,
    (state) => state.node.outputs,
    (state) => state.node.code,
    (state) => state.node.parameters,
    (state) => state.node.datasetType,
    (state) => state.node.originalType,
    (state) => state.node.transcodedTypes,
    (state) => state.node.runCommand,
    (state) => state.node.preview,
    (state) => state.node.previewType,
    (state) => state.node.stats,
    (state) => state.isPrettyName,
  ],
  (
    nodeId,
    nodeLabel,
    nodeFullName,
    nodePrettyName,
    nodeType,
    nodeTags,
    tagNames,
    pipeline,
    nodeFilepaths,
    nodeInputs,
    nodeOutputs,
    nodeCodes,
    nodeParameters,
    nodeDatasetTypes,
    nodeOriginalTypes,
    nodeTranscodedTypes,
    nodeRunCommand,
    preview,
    previewType,
    stats,
    isPrettyName
  ) => {
    if (!nodeId || Object.keys(nodeType).length === 0) {
      return null;
    }

    const metadata = {
      id: nodeId,
      name: nodeLabel[nodeId],
      fullName: nodeFullName[nodeId],
      prettyName: nodePrettyName[nodeId],
      type: nodeType[nodeId],
      tags: [...nodeTags[nodeId]]
        .map((tagId) => tagNames[tagId])
        .sort(sortAlpha),
      pipeline: pipeline.name[pipeline.active],
      parameters: nodeParameters[nodeId],
      runCommand: nodeRunCommand[nodeId],
      code: nodeCodes[nodeId],
      filepath: nodeFilepaths[nodeId],
      datasetType: nodeDatasetTypes[nodeId],
      originalType: nodeOriginalTypes[nodeId],
      transcodedTypes: nodeTranscodedTypes[nodeId],
      inputs: isPrettyName
        ? nodeInputs[nodeId] &&
          nodeInputs[nodeId].map((nodeInput) =>
            prettifyName(stripNamespace(nodeInput))
          )
        : nodeInputs[nodeId] &&
          nodeInputs[nodeId].map((nodeInput) => stripNamespace(nodeInput)),
      outputs: isPrettyName
        ? nodeOutputs[nodeId] &&
          nodeOutputs[nodeId].map((nodeOutput) =>
            prettifyName(stripNamespace(nodeOutput))
          )
        : nodeOutputs[nodeId] &&
          nodeOutputs[nodeId].map((nodeOutput) => stripNamespace(nodeOutput)),
      preview: preview && preview[nodeId],
      previewType: previewType && previewType[nodeId],
      stats: stats && stats[nodeId],
    };

    return metadata;
  }
);
