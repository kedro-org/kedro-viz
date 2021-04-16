import { createSelector } from 'reselect';
import { arrayToObject } from '../utils';
import { getNodeDisabledPipeline } from './pipeline';
import {
  getAllNodeIDs,
  getAllEdges,
  getModularPipelineCount,
  getModularPipelineChildren,
} from './modular-pipelines';
import { getTagCount } from './tags';

const getNodeIDs = (state) => state.node.ids;
const getNodeDisabledNode = (state) => state.node.disabled;
const getNodeTags = (state) => state.node.tags;
const getNodeModularPipelines = (state) => state.node.modularPipelines;
const getNodeType = (state) => state.node.type;
const getTagEnabled = (state) => state.tag.enabled;
const getModularPipelineEnabled = (state) => state.modularPipeline.enabled;
const getNodeTypeDisabled = (state) => state.nodeType.disabled;
const getLayerIDs = (state) => state.layer.ids;
const getLayersVisible = (state) => state.layer.visible;
const getNodeLayer = (state) => state.node.layer;
const getModularPipelineIDs = (state) => state.modularPipeline.ids;
const getModularPipelineContracted = (state) =>
  state.modularPipeline.contracted;

/**
 * Calculate whether nodes should be disabled based on their tags
 */
export const getNodeDisabledTag = createSelector(
  [getNodeIDs, getTagEnabled, getTagCount, getNodeTags],
  (nodeIDs, tagEnabled, tagCount, nodeTags) =>
    arrayToObject(nodeIDs, (nodeID) => {
      if (tagCount.enabled === 0) {
        return false;
      }
      if (nodeTags[nodeID].length) {
        // Hide task nodes that don't have at least one tag filter enabled
        return !nodeTags[nodeID].some((tag) => tagEnabled[tag]);
      }
      return true;
    })
);

/**
 * Calculate whether nodes should be disabled based on whether their modular pipeline
 * filters are enabled
 */
export const getNodeDisabledModularPipelineFilter = createSelector(
  [
    getNodeIDs,
    getModularPipelineEnabled,
    getModularPipelineCount,
    getNodeModularPipelines,
  ],
  (
    nodeIDs,
    modularPipelineEnabled,
    modularPipelineCount,
    nodeModularPipelines
  ) =>
    arrayToObject(nodeIDs, (nodeID) => {
      if (modularPipelineCount.enabled === 0) {
        return false;
      }
      if (nodeModularPipelines[nodeID].length) {
        // Hide task nodes that don't have at least one modular pipeline filter enabled
        return !nodeModularPipelines[nodeID].some(
          (modularPipeline) => modularPipelineEnabled[modularPipeline]
        );
      }
      return true;
    })
);

/**
 * Calculate whether nodes should be disabled based on whether a modular pipeline
 * they're in is contracted
 */
export const getNodeDisabledModularPipelineContracted = createSelector(
  [getNodeIDs, getNodeModularPipelines, getModularPipelineContracted],
  (nodeIDs, nodeModularPipelines, modularPipelineContracted) =>
    arrayToObject(nodeIDs, (nodeID) =>
      nodeModularPipelines[nodeID].some(
        (modPipID) => modularPipelineContracted[modPipID]
      )
    )
);

/**
 * Set disabled status if the node is specifically hidden, and/or via a tag/view/type/modularPipeline
 */
export const getNodeDisabled = createSelector(
  [
    getNodeIDs,
    getNodeDisabledNode,
    getNodeDisabledTag,
    getNodeDisabledModularPipelineFilter,
    getNodeDisabledModularPipelineContracted,
    getNodeDisabledPipeline,
    getNodeType,
    getNodeTypeDisabled,
    getModularPipelineIDs,
    getModularPipelineChildren,
    getModularPipelineContracted,
  ],
  (
    nodeIDs,
    nodeDisabledNode,
    nodeDisabledTag,
    nodeDisabledModularPipelineFilter,
    nodeDisabledModularPipelineContracted,
    nodeDisabledPipeline,
    nodeType,
    typeDisabled,
    modularPipelineIDs,
    modularPipelineChildren,
    modularPipelineContracted
  ) => {
    const nodeDisabled = arrayToObject(
      nodeIDs,
      (id) =>
        nodeDisabledNode[id] ||
        nodeDisabledTag[id] ||
        nodeDisabledModularPipelineFilter[id] ||
        nodeDisabledModularPipelineContracted[id] ||
        nodeDisabledPipeline[id] ||
        typeDisabled[nodeType[id]]
    );

    const modularPipelineDisabled = arrayToObject(
      modularPipelineIDs,
      (modPipID) => {
        const childrenDisabled = Object.keys(
          modularPipelineChildren[modPipID]
        ).every(
          (nodeID) =>
            nodeDisabledNode[nodeID] ||
            nodeDisabledTag[nodeID] ||
            nodeDisabledModularPipelineFilter[nodeID] ||
            nodeDisabledPipeline[nodeID] ||
            typeDisabled[nodeType[nodeID]]
        );
        const contracted = modularPipelineContracted[modPipID];
        return childrenDisabled || !contracted;
      }
    );

    return {
      ...nodeDisabled,
      ...modularPipelineDisabled,
    };
  }
);

/**
 * Get a list of just the IDs for the remaining visible nodes
 */
export const getVisibleNodeIDs = createSelector(
  [getAllNodeIDs, getNodeDisabled],
  (nodeIDs, nodeDisabled) => nodeIDs.filter((id) => !nodeDisabled[id])
);

/**
 * Get a list of just the IDs for the remaining visible layers
 */
export const getVisibleLayerIDs = createSelector(
  [getVisibleNodeIDs, getNodeLayer, getLayerIDs, getLayersVisible],
  (nodeIDs, nodeLayer, layerIDs, layersVisible) => {
    if (!layersVisible) {
      return [];
    }
    const visibleLayerIDs = {};
    for (const nodeID of nodeIDs) {
      visibleLayerIDs[nodeLayer[nodeID]] = true;
    }
    return layerIDs.filter((layerID) => visibleLayerIDs[layerID]);
  }
);

/**
 * Determine whether an edge should be disabled based on their source/target nodes
 */
export const getEdgeDisabled = createSelector(
  [getAllEdges, getNodeDisabled],
  ({ ids, sources, targets }, nodeDisabled) => {
    return arrayToObject(ids, (edgeID) => {
      const source = sources[edgeID];
      const target = targets[edgeID];
      return Boolean(nodeDisabled[source] || nodeDisabled[target]);
    });
  }
);
