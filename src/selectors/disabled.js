import { createSelector } from 'reselect';
import { arrayToObject } from '../utils';
import { getNodeDisabledPipeline, getPipelineNodeIDs } from './pipeline';
import { getTagCount } from './tags';
import { getModularPipelineCount } from './modular-pipelines';

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
const getLayerIDs = (state) => state.layer.ids;
const getLayersVisible = (state) => state.layer.visible;
const getNodeLayer = (state) => state.node.layer;

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

const isNodeOfActiveModularPipeline = (
  nodeModularPipelines,
  nodeID,
  modularPipelineEnabled
) =>
  nodeModularPipelines[nodeID].some(
    (modularPipeline) => modularPipelineEnabled[modularPipeline]
  );

/**
 * Calculate whether nodes should be disabled based on their modular pipelines,
 * except related dataset nodes and parameter nodes that are input and output
 * to the currently selected modular pipeline under focus mode
 */
export const getNodeDisabledModularPipeline = createSelector(
  [
    getNodeIDs,
    getModularPipelineEnabled,
    getModularPipelineCount,
    getNodeModularPipelines,
    getEdgeIDs,
    getNodeType,
    getEdgeSources,
    getEdgeTargets,
  ],
  (
    nodeIDs,
    modularPipelineEnabled,
    modularPipelineCount,
    nodeModularPipelines,
    edgeIDs,
    nodeType,
    edgeSources,
    edgeTargets
  ) =>
    arrayToObject(nodeIDs, (nodeID) => {
      // check for excpetion 1: when there are no modular pipelines enabled
      if (modularPipelineCount.enabled === 0) {
        return false;
      }

      const isDisabledByModularPipeline = !isNodeOfActiveModularPipeline(
        nodeModularPipelines,
        nodeID,
        modularPipelineEnabled
      );

      // check for excpetion 2: check for input/output nodes that are not part of modular pipelines
      if (
        isDisabledByModularPipeline &&
        (nodeType[nodeID] === 'parameters' || nodeType[nodeID] === 'data')
      ) {
        const relatedEdgeIDs = edgeIDs.filter((edgeID) =>
          edgeID.includes(nodeID)
        );

        let isMPEdge = false;

        relatedEdgeIDs.forEach((relatedEdgeID) => {
          const source = edgeSources[relatedEdgeID];
          const target = edgeTargets[relatedEdgeID];

          const isInput =
            source === nodeID &&
            isNodeOfActiveModularPipeline(
              nodeModularPipelines,
              target,
              modularPipelineEnabled
            );

          const isOutput =
            target === nodeID &&
            isNodeOfActiveModularPipeline(
              nodeModularPipelines,
              source,
              modularPipelineEnabled
            );

          // check if the target node belongs to a enabled modualr pipeline
          if ((isInput || isOutput) && isMPEdge === false) {
            isMPEdge = true;
          }
        });
        return !isMPEdge;
      }

      // Hide nodes that don't have at least one modular pipeline filter enabled
      return isDisabledByModularPipeline;
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
    getNodeDisabledModularPipeline,
    getNodeDisabledPipeline,
    getNodeType,
    getNodeTypeDisabled,
  ],
  (
    nodeIDs,
    nodeDisabledNode,
    nodeDisabledTag,
    nodeDisabledModularPipeline,
    nodeDisabledPipeline,
    nodeType,
    typeDisabled
  ) =>
    arrayToObject(nodeIDs, (id) =>
      [
        nodeDisabledNode[id],
        nodeDisabledTag[id],
        nodeDisabledModularPipeline[id],
        nodeDisabledPipeline[id],
        typeDisabled[nodeType[id]],
      ].some(Boolean)
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
