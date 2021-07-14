import { createSelector } from 'reselect';
import { arrayToObject } from '../utils';
import {
  getNodeDisabledPipeline,
  getPipelineModularPipelineIDs,
  getPipelineNodeIDs,
} from './pipeline';
import {
  getModularPipelineCount,
  getModularPipelineChildren,
  getModularPipelineParentsContracted,
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
const getEdgeIDs = (state) => state.edge.ids;
const getEdgeSources = (state) => state.edge.sources;
const getEdgeTargets = (state) => state.edge.targets;
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
 * Calculate whether nodes should be disabled based on their modular pipelines
 */
export const getNodeDisabledModularPipeline = createSelector(
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
    getNodeDisabledModularPipeline,
    getNodeDisabledPipeline,
    getNodeType,
    getNodeTypeDisabled,
  ],
  (
    nodeIDs,
    nodeDisabledNode,
    nodeDisabledTag,
    nodeDisabledModularPipelineFilter,
    nodeDisabledPipeline,
    nodeType,
    typeDisabled
  ) =>
    arrayToObject(
      nodeIDs,
      (id) =>
        nodeDisabledNode[id] ||
        nodeDisabledTag[id] ||
        nodeDisabledModularPipelineFilter[id] ||
        nodeDisabledPipeline[id] ||
        typeDisabled[nodeType[id]]
    )
);

/**
 * Set disabled status if the modular pipeline's children are all disabled
 */
export const getModularPipelineDisabledChildren = createSelector(
  [getModularPipelineIDs, getModularPipelineChildren, getNodeDisabled],
  (modularPipelineIDs, modularPipelineChildren, nodeDisabled) =>
    arrayToObject(modularPipelineIDs, (modPipID) => {
      const children = Object.keys(modularPipelineChildren[modPipID]);
      const allChildrenAreDisabled = children.every(
        (nodeID) => nodeDisabled[nodeID]
      );
      return allChildrenAreDisabled;
    })
);

/**
 * Set disabled status if the node is specifically hidden, and/or via a tag/view/type/modularPipeline
 */
export const getModularPipelineDisabled = createSelector(
  [
    getModularPipelineIDs,
    getModularPipelineDisabledChildren,
    getModularPipelineParentsContracted,
  ],
  (
    modularPipelineIDs,
    modularPipelineDisabledChildren,
    modularPipelineParentsContracted
  ) =>
    arrayToObject(
      modularPipelineIDs,
      (id) =>
        modularPipelineDisabledChildren[id] ||
        modularPipelineParentsContracted[id]
    )
);

/**
 * Get a list of just the IDs for the remaining visible nodes
 */
export const getVisibleNodeIDs = createSelector(
  [getPipelineNodeIDs, getNodeDisabled],
  (nodeIDs, nodeDisabled) => nodeIDs.filter((id) => !nodeDisabled[id])
);

/**
 * Get a list of just the IDs for the remaining visible nodes
 */
export const getVisibleModularPipelineIDs = createSelector(
  [getPipelineModularPipelineIDs, getModularPipelineDisabled],
  (modPipIDs, modularPipelineDisabled) =>
    modPipIDs.filter((id) => !modularPipelineDisabled[id])
);

/**
 * Determine whether an edge should be disabled based on their source/target nodes
 */
export const getEdgeDisabled = createSelector(
  [getEdgeIDs, getNodeDisabled, getEdgeSources, getEdgeTargets],
  (edgeIDs, nodeDisabled, edgeSources, edgeTargets) =>
    arrayToObject(edgeIDs, (edgeID) => {
      const source = edgeSources[edgeID];
      const target = edgeTargets[edgeID];
      return Boolean(nodeDisabled[source] || nodeDisabled[target]);
    })
);
