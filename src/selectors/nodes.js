import { createSelector } from 'reselect';
import { select } from 'd3-selection';
import { arrayToObject } from '../utils';
import { getTagCount } from './tags';
import { getCentralNode } from './linked-nodes';

const getNodeIDs = state => state.node.ids;
const getNodeName = state => state.node.name;
const getNodeFullName = state => state.node.fullName;
const getNodeDisabledNode = state => state.node.disabled;
const getNodeTags = state => state.node.tags;
const getNodeType = state => state.node.type;
const getTagActive = state => state.tag.active;
const getTagEnabled = state => state.tag.enabled;
const getTextLabels = state => state.textLabels;
const getFontLoaded = state => state.fontLoaded;
const getNodeTypeDisabled = state => state.nodeType.disabled;

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
    getNodeType,
    getNodeTypeDisabled
  ],
  (nodeIDs, nodeDisabledNode, nodeDisabledTag, nodeType, typeDisabled) =>
    arrayToObject(nodeIDs, id =>
      Boolean(
        nodeDisabledNode[id] ||
          nodeDisabledTag[id] ||
          typeDisabled[nodeType[id]]
      )
    )
);

/**
 * Set active status if the node is specifically highlighted, and/or via an associated tag
 * @return {Boolean} True if active
 */
export const getNodeActive = createSelector(
  [getNodeIDs, getCentralNode, getNodeTags, getTagActive],
  (nodeIDs, centralNode, nodeTags, tagActive) =>
    arrayToObject(nodeIDs, nodeID => {
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
    getNodeIDs,
    getNodeName,
    getNodeType,
    getNodeActive,
    getNodeDisabled,
    getNodeDisabledNode,
    getNodeDisabledTag,
    getNodeTypeDisabled
  ],
  (
    nodeIDs,
    nodeName,
    nodeType,
    nodeActive,
    nodeDisabled,
    nodeDisabledNode,
    nodeDisabledTag,
    typeDisabled
  ) =>
    nodeIDs
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
        disabled_type: Boolean(typeDisabled[nodeType[id]])
      }))
);

/**
 * Returns formatted nodes grouped by type
 */
export const getGroupedNodes = createSelector(
  [getNodeData],
  nodes =>
    nodes.reduce(function(obj, item) {
      const key = item.type;
      if (!obj.hasOwnProperty(key)) {
        obj[key] = [];
      }
      obj[key].push(item);
      return obj;
    }, {})
);

/**
 * Temporarily create a new SVG container in the DOM, write a node to it,
 * measure its width with getBBox, then delete the container and store the value
 */
export const getNodeTextWidth = createSelector(
  [getNodeIDs, getNodeName, getFontLoaded],
  (nodeIDs, nodeName) => {
    const svg = select(document.body)
      .append('svg')
      .attr('class', 'kedro node');
    const nodeTextWidth = arrayToObject(nodeIDs, nodeID => {
      const text = svg.append('text').text(nodeName[nodeID]);
      const node = text.node();
      const width = node.getBBox ? node.getBBox().width : 0;
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
  [getNodeIDs, getNodeTextWidth, getTextLabels, getNodeType],
  (nodeIDs, nodeTextWidth, textLabels, nodeType) =>
    arrayToObject(nodeIDs, nodeID => {
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
    getNodeIDs,
    getNodeName,
    getNodeType,
    getNodeDisabled,
    getNodeFullName,
    getNodeSize
  ],
  (nodeIDs, nodeName, nodeType, nodeDisabled, nodeFullName, nodeSize) =>
    nodeIDs
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
