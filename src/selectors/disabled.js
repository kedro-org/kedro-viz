import { createSelector } from 'reselect';
import { arrayToObject } from '../utils';
import { getNodeDisabledPipeline, getPipelineNodeIDs } from './pipeline';
import {
  getFocusedModularPipeline,
  getModularPipelinesTree,
} from './modular-pipelines';
import { getTagCount } from './tags';
import { getSlicedPipeline } from './sliced-pipeline';

const getNodeIDs = (state) => state.node.ids;
const getNodeDisabledNode = (state) => state.node.disabled;
const getDisabledModularPipeline = (state) => state.modularPipeline.disabled;
const getNodeTags = (state) => state.node.tags;
const getNodeType = (state) => state.node.type;
const getTagEnabled = (state) => state.tag.enabled;
const getNodeTypeDisabled = (state) => state.nodeType.disabled;
const getEdgeIDs = (state) => state.edge.ids;
const getEdgeSources = (state) => state.edge.sources;
const getEdgeTargets = (state) => state.edge.targets;
const getLayerIDs = (state) => state.layer.ids;
const getLayersVisible = (state) => state.layer.visible;
const getNodeLayer = (state) => state.node.layer;
const getNodeModularPipelines = (state) => state.node.modularPipelines;
const getVisibleSidebarNodes = (state) => state.modularPipeline.visible;
const getSliceApply = (state) => state.slice.apply;

/**
 * Return all inputs and outputs of currently visible modular pipelines
 * so that even if they are not expanded, their inputs and outputs are still rendered.
 */
const getVisibleModularPipelineInputsOutputs = createSelector(
  [getVisibleSidebarNodes, getModularPipelinesTree],
  (visibleSidebarNodes, modularPipelineData) => {
    const result = new Set();
    for (const nodeID in visibleSidebarNodes) {
      if (visibleSidebarNodes[nodeID] && nodeID in modularPipelineData) {
        [
          ...modularPipelineData[nodeID].inputs,
          ...modularPipelineData[nodeID].outputs,
        ].forEach((nodeID) => result.add(nodeID));
      }
    }
    return result;
  }
);

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
 * Determine if a node is disabled via disabled modular pipeline or focused modular pipeline.
 */
export const getnodesDisabledViaModularPipeline = createSelector(
  [
    getNodeIDs,
    getNodeType,
    getNodeModularPipelines,
    getModularPipelinesTree,
    getFocusedModularPipeline,
    getDisabledModularPipeline,
  ],
  (
    nodeIDs,
    nodeType,
    nodeModularPipelines,
    modularPipelinesTree,
    focusedModularPipeline,
    disabledModularPipeline
  ) =>
    arrayToObject(nodeIDs, (id) => {
      let isDisabledViaModularPipeline =
        disabledModularPipeline[nodeModularPipelines[id]];

      let isDisabledViaFocusedModularPipeline = false;

      if (focusedModularPipeline) {
        const inputOutputNodeIDs = [
          ...modularPipelinesTree[focusedModularPipeline.id].inputs,
          ...modularPipelinesTree[focusedModularPipeline.id].outputs,
        ];

        const isChildModularPipeline = (modularPipelineId, focusedPipelineId) =>
          modularPipelineId.startsWith(`${focusedPipelineId}.`);

        const isParentModularPipeline = (
          modularPipelineId,
          focusedPipelineId
        ) => focusedPipelineId.startsWith(`${modularPipelineId}.`);

        const isChildNode = (nodeId) =>
          nodeModularPipelines[nodeId]?.includes(focusedModularPipeline.id);

        if (nodeType[id] === 'modularPipeline') {
          return (
            id !== focusedModularPipeline.id &&
            !isChildModularPipeline(id, focusedModularPipeline.id) &&
            !isParentModularPipeline(id, focusedModularPipeline.id)
          );
        }

        isDisabledViaFocusedModularPipeline =
          !isChildNode(id) &&
          !nodeModularPipelines[id]?.some((pipelineId) =>
            isChildModularPipeline(pipelineId, focusedModularPipeline.id)
          ) &&
          !isParentModularPipeline(
            nodeModularPipelines[id],
            focusedModularPipeline.id
          ) &&
          !inputOutputNodeIDs.includes(id);
      }

      return [
        isDisabledViaFocusedModularPipeline,
        isDisabledViaModularPipeline,
      ].some(Boolean);
    })
);

/**
 * Set disabled status if the node is specifically hidden, and/or via a tag/view/type/modularPipeline
 */
export const getNodeDisabled = createSelector(
  [
    getNodeIDs,
    getNodeDisabledNode,
    getNodeDisabledTag,
    getNodeDisabledPipeline,
    getnodesDisabledViaModularPipeline,
    getNodeType,
    getNodeTypeDisabled,
    getVisibleSidebarNodes,
    getVisibleModularPipelineInputsOutputs,
    getDisabledModularPipeline,
    getSlicedPipeline,
    getSliceApply,
  ],
  (
    nodeIDs,
    nodeDisabledNode,
    nodeDisabledTag,
    nodeDisabledPipeline,
    nodesDisabledViaModularPipeline,
    nodeType,
    typeDisabled,
    visibleSidebarNodes,
    visibleModularPipelineInputsOutputs,
    disabledModularPipeline,
    slicedPipeline,
    isSliceApplied
  ) =>
    arrayToObject(nodeIDs, (id) => {
      let isDisabledViaSlicedPipeline = false;
      if (isSliceApplied && slicedPipeline.length > 0) {
        isDisabledViaSlicedPipeline = !slicedPipeline.includes(id);
      }

      const isDisabledViaSidebar =
        !visibleSidebarNodes[id] &&
        !visibleModularPipelineInputsOutputs.has(id);

      const isDisabledViaModularPipeline = nodesDisabledViaModularPipeline[id];

      return [
        nodeDisabledNode[id],
        nodeDisabledTag[id],
        nodeDisabledPipeline[id],
        disabledModularPipeline[id],
        typeDisabled[nodeType[id]],
        isDisabledViaSidebar,
        isDisabledViaModularPipeline,
        isDisabledViaSlicedPipeline,
      ].some(Boolean);
    })
);

/**
 * Get a list of just the IDs for the remaining visible nodes
 */
export const getVisibleNodeIDs = createSelector(
  [getPipelineNodeIDs, getNodeDisabled],
  (nodeIDs, nodeDisabled) => {
    return nodeIDs.filter((id) => !nodeDisabled[id]);
  }
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
  [getEdgeIDs, getNodeDisabled, getEdgeSources, getEdgeTargets],
  (edgeIDs, nodeDisabled, edgeSources, edgeTargets) =>
    arrayToObject(edgeIDs, (edgeID) => {
      const source = edgeSources[edgeID];
      const target = edgeTargets[edgeID];
      return Boolean(nodeDisabled[source] || nodeDisabled[target]);
    })
);
