import { createSelector } from 'reselect';
import { select } from 'd3-selection';
import { arrayToObject } from '../utils';
import { getTagCount } from './tags';
import { getCentralNode } from './linked-nodes';

const getNodes = state => state.nodes;
const getView = state => state.view;
const getNodeName = state => state.nodeName;
const getNodeFullName = state => state.nodeFullName;
const getNodeDisabledNode = state => state.nodeDisabled;
const getNodeTags = state => state.nodeTags;
const getNodeType = state => state.nodeType;
const getTagActive = state => state.tagActive;
const getTagEnabled = state => state.tagEnabled;
const getTextLabels = state => state.textLabels;

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
 * Temporarily create a new SVG container in the DOM, write a node to it,
 * measure its width with getBBox, then delete the container and store the value
 */
export const getNodeTextWidth = createSelector(
  [getNodes, getNodeName],
  (nodes, nodeName) => {
    const svg = select(document.body)
      .append('svg')
      .attr('class', 'kedro node');
    const nodeTextWidth = arrayToObject(nodes, nodeID => {
      const text = svg.append('text').text(nodeName[nodeID]);
      const node = text.node();
      const width = node.getBBox ? node.getBBox().width : 0;
      text.remove();
      return width;
    });
    svg.remove();
    return nodeTextWidth;
  }
);

/**
 * Get the top/bottom and left/right padding for a node
 * @param {Boolean} showLabels Whether labels are visible
 * @param {Boolean} isTask Whether the node is a task type (vs data/params)
 */
export const getPadding = (showLabels, isTask) => {
  if (showLabels) {
    return { x: 16, y: 10 };
  }
  if (isTask) {
    return { x: 14, y: 14 };
  }
  return { x: 16, y: 16 };
};

/**
 * Calculate node width/height and icon/text positioning
 */
export const getNodeSize = createSelector(
  [getNodes, getNodeTextWidth, getTextLabels, getNodeType],
  (nodes, nodeTextWidth, textLabels, nodeType) =>
    arrayToObject(nodes, nodeID => {
      const iconSize = textLabels ? 14 : 24;
      const padding = getPadding(textLabels, nodeType[nodeID] === 'task');
      const textWidth = textLabels ? nodeTextWidth[nodeID] : 0;
      const textGap = textLabels ? 6 : 0;
      const innerWidth = iconSize + textWidth + textGap;
      return {
        width: innerWidth + padding.x * 2,
        height: iconSize + padding.y * 2,
        textOffset: (innerWidth - textWidth) / 2,
        iconOffset: -innerWidth / 2,
        iconSize
      };
    })
);

/**
 * Returns only visible nodes as an array, but without any extra properties
 * that are unnecessary for the chart layout calculation
 */
export const getVisibleNodes = createSelector(
  [
    getNodes,
    getNodeName,
    getNodeType,
    getNodeDisabled,
    getNodeFullName,
    getNodeSize
  ],
  (nodes, nodeName, nodeType, nodeDisabled, nodeFullName, nodeSize) =>
    nodes
      .filter(id => !nodeDisabled[id])
      .map(id => ({
        id,
        name: nodeName[id],
        label: nodeName[id],
        fullName: nodeFullName[id],
        type: nodeType[id],
        ...nodeSize[id]
      }))
);
