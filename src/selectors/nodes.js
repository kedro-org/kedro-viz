import { createSelector } from 'reselect';
import { arrayToObject } from '../utils';
import { getTagCount } from './tags';
import { getCentralNode } from './linked-nodes';

const getNodes = state => state.nodes;
const getView = state => state.view;
const getNodeName = state => state.nodeName;
const getNodeDisabledNode = state => state.nodeDisabled;
const getNodeTags = state => state.nodeTags;
const getNodeType = state => state.nodeType;
const getTagActive = state => state.tagActive;
const getTagEnabled = state => state.tagEnabled;

/**
 * Calculate whether nodes should be disabled based on their tags
 */
export const getNodeDisabledTag = createSelector(
  [getNodes, getTagEnabled, getTagCount, getNodeTags],
  (nodes, tagEnabled, tagCount, nodeTags) =>
    arrayToObject(nodes, nodeID => {
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
 * Calculate whether nodes should be disabled based on the view
 */
export const getNodeDisabledView = createSelector(
  [getNodes, getNodeType, getView],
  (nodes, nodeType, view) =>
    arrayToObject(
      nodes,
      nodeID => view !== 'combined' && view !== nodeType[nodeID]
    )
);

/**
 * Set disabled status if the node is specifically hidden, and/or via a tag/view
 */
export const getNodeDisabled = createSelector(
  [getNodes, getNodeDisabledNode, getNodeDisabledTag, getNodeDisabledView],
  (nodes, nodeDisabledNode, nodeDisabledTag, nodeDisabledView) =>
    arrayToObject(nodes, id =>
      Boolean(
        nodeDisabledNode[id] || nodeDisabledTag[id] || nodeDisabledView[id]
      )
    )
);

/**
 * Set active status if the node is specifically highlighted, and/or via an associated tag
 * @return {Boolean} True if active
 */
export const getNodeActive = createSelector(
  [getNodes, getCentralNode, getNodeTags, getTagActive],
  (nodes, centralNode, nodeTags, tagActive) =>
    arrayToObject(nodes, nodeID => {
      if (nodeID === centralNode) {
        return true;
      }
      const activeViaTag = nodeTags[nodeID].some(tag => tagActive[tag]);
      return Boolean(activeViaTag);
    })
);

/**
 * Returns formatted nodes as an array, with all relevant properties
 */
export const getNodeData = createSelector(
  [
    getNodes,
    getNodeName,
    getNodeType,
    getNodeActive,
    getNodeDisabled,
    getNodeDisabledNode,
    getNodeDisabledTag,
    getNodeDisabledView
  ],
  (
    nodes,
    nodeName,
    nodeType,
    nodeActive,
    nodeDisabled,
    nodeDisabledNode,
    nodeDisabledTag,
    nodeDisabledView
  ) =>
    nodes
      .sort((a, b) => {
        if (nodeName[a] < nodeName[b]) return -1;
        if (nodeName[a] > nodeName[b]) return 1;
        return 0;
      })
      .map(id => ({
        id,
        name: nodeName[id],
        type: nodeType[id],
        active: nodeActive[id],
        disabled: nodeDisabled[id],
        disabled_node: Boolean(nodeDisabledNode[id]),
        disabled_tag: nodeDisabledTag[id],
        disabled_view: nodeDisabledView[id]
      }))
);

/**
 * Returns only visible nodes as an array, but without any extra properties
 * that are unnecessary for the chart layout calculation
 */
export const getVisibleNodes = createSelector(
  [getNodes, getNodeName, getNodeType, getNodeDisabled],
  (nodes, nodeName, nodeType, nodeDisabled) =>
    nodes
      .filter(id => !nodeDisabled[id])
      .map(id => ({
        id,
        name: nodeName[id],
        type: nodeType[id],
        disabled: nodeDisabled[id]
      }))
);
