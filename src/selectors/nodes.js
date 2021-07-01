import { createSelector } from 'reselect';
import { select } from 'd3-selection';
import { arrayToObject } from '../utils';
import { getPipelineNodeIDs } from './pipeline';
import {
  getNodeDisabled,
  getNodeDisabledTag,
  getVisibleNodeIDs,
  getNodeDisabledModularPipeline,
} from './disabled';
import getShortType from '../utils/short-type';
import { getNodeRank } from './ranks';

const getNodeName = (state) => state.node.name;
const getNodeFullName = (state) => state.node.fullName;
const getNodeDisabledNode = (state) => state.node.disabled;
const getNodeTags = (state) => state.node.tags;
export const getNodeModularPipelines = (state) => state.node.modularPipelines;
const getNodeType = (state) => state.node.type;
const getNodeDatasetType = (state) => state.node.datasetType;
const getNodeLayer = (state) => state.node.layer;
const getHoveredNode = (state) => state.node.hovered;
const getTagActive = (state) => state.tag.active;
const getModularPipelineActive = (state) => state.modularPipeline.active;
const getTextLabels = (state) => state.textLabels;
const getFontLoaded = (state) => state.fontLoaded;
const getNodeTypeDisabled = (state) => state.nodeType.disabled;
const getClickedNode = (state) => state.node.clicked;
const getEdgeIDs = (state) => state.edge.ids;
const getEdgeSources = (state) => state.edge.sources;
const getEdgeTargets = (state) => state.edge.targets;

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
 * Set active status if the node is specifically highlighted, and/or via an associated tag or modular pipeline
 */
export const getNodeActive = createSelector(
  [
    getPipelineNodeIDs,
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
      const activeViaTag = nodeTags[nodeID].some((tag) => tagActive[tag]);
      const activeViaModularPipeline =
        nodeModularPipelines[nodeID] &&
        nodeModularPipelines[nodeID].some(
          (modularPipeline) => modularPipelineActive[modularPipeline]
        );
      return Boolean(activeViaTag) || Boolean(activeViaModularPipeline);
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
    getNodeDatasetType,
    getNodeDisabled,
    getNodeDisabledNode,
    getNodeDisabledTag,
    getNodeDisabledModularPipeline,
    getNodeTypeDisabled,
    getNodeModularPipelines,
  ],
  (
    nodeIDs,
    nodeName,
    nodeType,
    nodeDatasetType,
    nodeDisabled,
    nodeDisabledNode,
    nodeDisabledTag,
    nodeDisabledModularPipeline,
    typeDisabled,
    nodeModularPipelines
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
        icon: getShortType([nodeDatasetType[id]], nodeType[id]),
        modularPipelines: nodeModularPipelines[id],
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
  [getPipelineNodeIDs, getNodeName, getFontLoaded],
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
 * @param {Boolean} isTask Whether the node is a task type (vs data/params)
 */
export const getPadding = (showLabels, isTask) => {
  if (showLabels) {
    if (isTask) {
      return { x: 16, y: 10 };
    }
    return { x: 20, y: 10 };
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
  [
    getPipelineNodeIDs,
    getNodeTextWidth,
    getTextLabels,
    getNodeType,
    getFontLoaded,
  ],
  (nodeIDs, nodeTextWidth, textLabels, nodeType, fontLoaded) => {
    if (!fontLoaded) {
      return {};
    }
    return arrayToObject(nodeIDs, (nodeID) => {
      const iconSize = textLabels ? 24 : 28;
      const padding = getPadding(textLabels, nodeType[nodeID] === 'task');
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
    getVisibleNodeIDs,
    getNodeName,
    getNodeType,
    getNodeDatasetType,
    getNodeFullName,
    getNodeSize,
    getNodeLayer,
    getNodeRank,
    getFontLoaded,
  ],
  (
    nodeIDs,
    nodeName,
    nodeType,
    nodeDatasetType,
    nodeFullName,
    nodeSize,
    nodeLayer,
    nodeRank,
    fontLoaded
  ) =>
    fontLoaded
      ? nodeIDs.map((id) => ({
          id,
          name: nodeName[id],
          label: nodeName[id],
          fullName: nodeFullName[id],
          icon: getShortType([nodeDatasetType[id]], nodeType[id]),
          type: nodeType[id],
          layer: nodeLayer[id],
          rank: nodeRank[id],
          ...nodeSize[id],
        }))
      : []
);

/**
 * Returns an map of task nodeIDs to graph nodes that have parameter nodes as their source
 */
export const getNodesWithInputParams = createSelector(
  [getGraphNodes, getEdgeIDs, getNodeType, getEdgeSources, getEdgeTargets],
  (nodes, edgeIDs, nodeType, edgeSources, edgeTargets) => {
    const nodesList = {};
    for (const edgeID of edgeIDs) {
      const source = edgeSources[edgeID];
      const target = edgeTargets[edgeID];
      if (nodeType[source] === 'parameters' && nodeType[target] === 'task') {
        nodesList[target] = nodes[target];
      }
    }
    return nodesList;
  }
);

const getNodeEdges = (nodeID, edgeIDs) =>
  edgeIDs.filter((edge) => edge.includes(nodeID));

export const getNodeSourceNames = createSelector(
  [getPipelineNodeIDs, getNodeName, getEdgeIDs, getEdgeSources, getEdgeTargets],
  (nodeIDs, nodeName, edgeIDs, edgeSources, edgeTargets) =>
    arrayToObject(nodeIDs, (nodeID) => {
      const filteredEdgeIds = getNodeEdges(nodeID, edgeIDs);
      const sources = [];
      for (const edgeID of filteredEdgeIds) {
        if (edgeTargets[edgeID] === nodeID) {
          sources.push(nodeName[edgeSources[edgeID]]);
        }
      }
      return sources;
    })
);

export const getNodeTargetNames = createSelector(
  [getPipelineNodeIDs, getNodeName, getEdgeIDs, getEdgeSources, getEdgeTargets],
  (nodeIDs, nodeName, edgeIDs, edgeSources, edgeTargets) =>
    arrayToObject(nodeIDs, (nodeID) => {
      const filteredEdgeIds = getNodeEdges(nodeID, edgeIDs);
      const targets = [];
      for (const edgeID of filteredEdgeIds) {
        if (edgeSources[edgeID] === nodeID) {
          targets.push(nodeName[edgeTargets[edgeID]]);
        }
      }
      return targets;
    })
);
