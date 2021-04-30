import { createSelector } from 'reselect';
import { select } from 'd3-selection';
import { arrayToObject } from '../utils';
import { getPipelineNodeIDs } from './pipeline';
import {
  getAllNodeIDs,
  getAllNodeNames,
  getAllNodeTypes,
} from './modular-pipelines';
import {
  getNodeDisabled,
  getNodeDisabledTag,
  getVisibleNodeIDs,
  getNodeDisabledModularPipelineFilter,
} from './disabled';
import { getNodeRank } from './ranks';

const getNodeName = (state) => state.node.name;
const getNodeFullName = (state) => state.node.fullName;
const getNodeDisabledNode = (state) => state.node.disabled;
const getNodeTags = (state) => state.node.tags;
const getNodeModularPipelines = (state) => state.node.modularPipelines;
const getNodeType = (state) => state.node.type;
const getNodeLayer = (state) => state.node.layer;
const getHoveredNode = (state) => state.node.hovered;
const getTagActive = (state) => state.tag.active;
const getModularPipelineActive = (state) => state.modularPipeline.active;
const getTextLabels = (state) => state.textLabels;
const getFontLoaded = (state) => state.fontLoaded;
const getNodeTypeDisabled = (state) => state.nodeType.disabled;
const getClickedNode = (state) => state.node.clicked;

/**
 * Gets a map of nodeIds to graph nodes
 */
export const getGraphNodes = createSelector(
  [(state) => state.graph.nodes],
  (nodes = []) =>
    nodes.reduce((result, node) => {
      result[node.id] = node;
      return result;
    }, {})
);

/**
 * Set active status if the node is specifically highlighted,
 * and/or via an associated tag or modular pipeline
 */
export const getNodeActive = createSelector(
  [
    getAllNodeIDs,
    getHoveredNode,
    getNodeTags,
    getNodeModularPipelines,
    getTagActive,
    getModularPipelineActive,
  ],
  (
    nodeIDs,
    hoveredNode,
    nodeTags,
    nodeModularPipelines,
    tagActive,
    modularPipelineActive
  ) =>
    arrayToObject(nodeIDs, (nodeID) => {
      if (nodeID === hoveredNode) {
        return true;
      }
      const tags = nodeTags[nodeID] || [];
      const activeViaTag = tags.some((tag) => tagActive[tag]);
      const modularPipelines = nodeModularPipelines[nodeID] || [];
      const activeViaModularPipeline = modularPipelines.some(
        (modularPipeline) => modularPipelineActive[modularPipeline]
      );
      const isActiveModularPipeline = modularPipelineActive[nodeID];
      return Boolean(
        activeViaTag || activeViaModularPipeline || isActiveModularPipeline
      );
    })
);

/**
 * Set selected status if the node is clicked
 */
export const getNodeSelected = createSelector(
  [getPipelineNodeIDs, getClickedNode, getNodeDisabled],
  (nodeIDs, clickedNode, nodeDisabled) =>
    arrayToObject(
      nodeIDs,
      (nodeID) => nodeID === clickedNode && !nodeDisabled[nodeID]
    )
);

/**
 * Returns formatted nodes as an array, with all relevant properties
 */
export const getNodeData = createSelector(
  [
    getPipelineNodeIDs,
    getNodeName,
    getNodeType,
    getNodeDisabled,
    getNodeDisabledNode,
    getNodeDisabledTag,
    getNodeDisabledModularPipelineFilter,
    getNodeTypeDisabled,
  ],
  (
    nodeIDs,
    nodeName,
    nodeType,
    nodeDisabled,
    nodeDisabledNode,
    nodeDisabledTag,
    nodeDisabledModularPipeline,
    typeDisabled
  ) =>
    nodeIDs
      .sort((a, b) => {
        if (nodeName[a] < nodeName[b]) {
          return -1;
        }
        if (nodeName[a] > nodeName[b]) {
          return 1;
        }
        return 0;
      })
      .map((id) => ({
        id,
        name: nodeName[id],
        type: nodeType[id],
        disabled: nodeDisabled[id],
        disabled_node: Boolean(nodeDisabledNode[id]),
        disabled_tag: nodeDisabledTag[id],
        disabled_modularPipeline: nodeDisabledModularPipeline[id],
        disabled_type: Boolean(typeDisabled[nodeType[id]]),
      }))
);

/**
 * Returns formatted nodes grouped by type
 */
export const getGroupedNodes = createSelector([getNodeData], (nodes) =>
  nodes.reduce(function (obj, item) {
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
  [getAllNodeIDs, getAllNodeNames, getFontLoaded],
  (nodeIDs, nodeName, fontLoaded) => {
    if (!fontLoaded) {
      return {};
    }
    const nodeTextWidth = {};
    const svg = select(document.body)
      .append('svg')
      .attr('class', 'kedro pipeline-node');
    svg
      .selectAll('text')
      .data(nodeIDs)
      .enter()
      .append('text')
      .text((nodeID) => nodeName[nodeID])
      .each(function (nodeID) {
        const width = this.getBBox ? this.getBBox().width : 0;
        nodeTextWidth[nodeID] = width;
      });
    svg.remove();
    return nodeTextWidth;
  }
);

/**
 * Get the top/bottom and left/right padding for a node
 * @param {Boolean} showLabels Whether labels are visible
 * @param {string} nodeType task/data/parameters/pipeline
 */
export const getPadding = (showLabels, nodeType) => {
  if (showLabels) {
    switch (nodeType) {
      case 'pipeline':
        return { x: 30, y: 22 };
      case 'task':
        return { x: 16, y: 10 };
      default:
        return { x: 20, y: 10 };
    }
  }
  switch (nodeType) {
    case 'pipeline':
      return { x: 25, y: 25 };
    case 'task':
      return { x: 14, y: 14 };
    default:
      return { x: 16, y: 16 };
  }
};

/**
 * Calculate node width/height and icon/text positioning
 */
export const getNodeSize = createSelector(
  [
    getAllNodeIDs,
    getNodeTextWidth,
    getTextLabels,
    getAllNodeTypes,
    getFontLoaded,
  ],
  (nodeIDs, nodeTextWidth, textLabels, nodeType, fontLoaded) => {
    if (!fontLoaded) {
      return {};
    }
    return arrayToObject(nodeIDs, (nodeID) => {
      const iconSize = textLabels ? 24 : 28;
      const padding = getPadding(textLabels, nodeType[nodeID]);
      const textWidth = textLabels ? nodeTextWidth[nodeID] : 0;
      const textGap = textLabels ? 6 : 0;
      const innerWidth = iconSize + textWidth + textGap;
      return {
        showText: textLabels,
        width: innerWidth + padding.x * 2,
        height: iconSize + padding.y * 2,
        textOffset: (innerWidth - textWidth) / 2 - 1,
        iconOffset: -innerWidth / 2,
        iconSize,
      };
    });
  }
);

/**
 * Returns only visible nodes as an array, but without any extra properties
 * that are unnecessary for the chart layout calculation
 */
export const getVisibleNodes = createSelector(
  [
    getFontLoaded,
    getVisibleNodeIDs,
    getAllNodeNames,
    getAllNodeTypes,
    getNodeFullName,
    getNodeSize,
    getNodeLayer,
    getNodeRank,
  ],
  (
    fontLoaded,
    nodeIDs,
    nodeName,
    nodeType,
    nodeFullName,
    nodeSize,
    nodeLayer,
    nodeRank
  ) => {
    if (!fontLoaded) {
      return [];
    }
    const nodes = nodeIDs.map((id) => ({
      id,
      name: nodeName[id],
      label: nodeName[id],
      fullName: nodeFullName[id] || id,
      type: nodeType[id],
      layer: nodeLayer[id],
      rank: nodeRank[id],
      ...nodeSize[id],
    }));
    return nodes;
  }
);
