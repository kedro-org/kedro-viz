import { createSelector } from 'reselect';
import { arrayToObject } from '../utils';
import { getTagCount } from './tags';

const getNodeIDs = state => state.node.ids;
const getNodeDisabledNode = state => state.node.disabled;
const getNodeTags = state => state.node.tags;
const getNodeType = state => state.node.type;
const getTagEnabled = state => state.tag.enabled;
const getNodeTypeDisabled = state => state.nodeType.disabled;
const getEdgeIDs = state => state.edge.ids;
const getEdgeSources = state => state.edge.sources;
const getEdgeTargets = state => state.edge.targets;
const getLayerIDs = state => state.layer.ids;
const getNodeLayer = state => state.node.layer;
const getNodePipelines = state => state.node.pipelines;
const getActivePipeline = state => state.pipeline.active;

/**
 * Calculate whether nodes should be disabled based on their tags
 */
export const getNodeDisabledPipeline = createSelector(
  [getNodeIDs, getNodePipelines, getActivePipeline],
  (nodeIDs, nodePipelines, activePipeline) =>
    arrayToObject(nodeIDs, nodeID => {
      if (!activePipeline) {
        return false;
      }
      return !nodePipelines[nodeID][activePipeline];
    })
);

/**
 * Calculate whether nodes should be disabled based on their tags
 */
export const getNodeDisabledTag = createSelector(
  [getNodeIDs, getTagEnabled, getTagCount, getNodeTags],
  (nodeIDs, tagEnabled, tagCount, nodeTags) =>
    arrayToObject(nodeIDs, nodeID => {
      if (tagCount.enabled === 0) {
        return false;
      }
      if (nodeTags[nodeID].length) {
        // Hide task nodes that don't have at least one tag filter enabled
        return !nodeTags[nodeID].some(tag => tagEnabled[tag]);
      }
      return true;
    })
);

/**
 * Set disabled status if the node is specifically hidden, and/or via a tag/view/type
 */
export const getNodeDisabled = createSelector(
  [
    getNodeIDs,
    getNodeDisabledNode,
    getNodeDisabledTag,
    getNodeDisabledPipeline,
    getNodeType,
    getNodeTypeDisabled
  ],
  (
    nodeIDs,
    nodeDisabledNode,
    nodeDisabledTag,
    nodeDisabledPipeline,
    nodeType,
    typeDisabled
  ) =>
    arrayToObject(nodeIDs, id =>
      [
        nodeDisabledNode[id],
        nodeDisabledTag[id],
        nodeDisabledPipeline[id],
        typeDisabled[nodeType[id]]
      ].some(Boolean)
    )
);

/**
 * Get a list of just the IDs for the remaining visible nodes
 */
export const getVisibleNodeIDs = createSelector(
  [getNodeIDs, getNodeDisabled],
  (nodeIDs, nodeDisabled) => nodeIDs.filter(id => !nodeDisabled[id])
);

/**
 * Get a list of just the IDs for the remaining visible layers
 */
export const getVisibleLayerIDs = createSelector(
  [getVisibleNodeIDs, getNodeLayer, getLayerIDs],
  (nodeIDs, nodeLayer, layerIDs) => {
    const visibleLayerIDs = {};
    for (const nodeID of nodeIDs) {
      visibleLayerIDs[nodeLayer[nodeID]] = true;
    }
    return layerIDs.filter(layerID => visibleLayerIDs[layerID]);
  }
);

/**
 * Determine whether an edge should be disabled based on their source/target nodes
 */
export const getEdgeDisabled = createSelector(
  [getEdgeIDs, getNodeDisabled, getEdgeSources, getEdgeTargets],
  (edgeIDs, nodeDisabled, edgeSources, edgeTargets) =>
    arrayToObject(edgeIDs, edgeID => {
      const source = edgeSources[edgeID];
      const target = edgeTargets[edgeID];
      return Boolean(nodeDisabled[source] || nodeDisabled[target]);
    })
);
