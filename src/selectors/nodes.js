import { createSelector } from 'reselect';
import { select } from 'd3-selection';
import { arrayToObject } from '../utils';
import { getPipelineNodeIDs } from './pipeline';
import { getContractedModularPipelines } from './contracted';
import {
  getNodeDisabled,
  getNodeDisabledTag,
  getNodeDisabledModularPipeline,
} from './disabled';
import getShortType from '../utils/short-type';
import { getNodeRank } from './ranks';

const getNodeName = (state) => state.node.name;
const getNodeDisabledNode = (state) => state.node.disabled;
const getNodeTags = (state) => state.node.tags;
export const getNodeModularPipelines = (state) => state.node.modularPipelines;
const getNodeType = (state) => state.node.type;
const getNodeDatasetType = (state) => state.node.datasetType;
const getHoveredNode = (state) => state.node.hovered;
const getTagActive = (state) => state.tag.active;
const getModularPipelineActive = (state) => state.modularPipeline.active;
const getModularPipelineName = (state) => state.modularPipeline.name;
const getTextLabels = (state) => state.textLabels;
const getFontLoaded = (state) => state.fontLoaded;
const getNodeTypeDisabled = (state) => state.nodeType.disabled;
const getClickedNode = (state) => state.node.clicked;
const getEdgeIDs = (state) => state.edge.ids;
const getEdgeSources = (state) => state.edge.sources;
const getEdgeTargets = (state) => state.edge.targets;
const getFocusedModularPipeline = (state) =>
  state.visible.modularPipelineFocusMode;

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
    getContractedModularPipelines,
    getHoveredNode,
    getNodeTags,
    getNodeModularPipelines,
    getTagActive,
    getModularPipelineActive,
  ],
  (
    { node },
    hoveredNode,
    nodeTags,
    nodeModularPipelines,
    tagActive,
    modularPipelineActive
  ) =>
    arrayToObject(node.ids, (nodeID) => {
      if (nodeID === hoveredNode) {
        return true;
      }
      const tags = nodeTags[nodeID] || [];
      const activeViaTag = tags.some((tag) => tagActive[tag]);
      const modularPipelines = nodeModularPipelines[nodeID] || [];
      const activeViaModularPipeline = modularPipelines.some(
        (modularPipeline) => modularPipelineActive[modularPipeline]
      );
      const isActiveModularPipeline =
        modularPipelineActive[node.modularPipeline[nodeID]];
      return Boolean(
        activeViaTag || activeViaModularPipeline || isActiveModularPipeline
      );
    })
);

/**
 * Set selected status if the node is clicked
 */
export const getNodeSelected = createSelector(
  [getContractedModularPipelines, getClickedNode, getNodeDisabled],
  ({ node }, clickedNode, nodeDisabled) =>
    arrayToObject(
      node.ids,
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
        disabledNode: Boolean(nodeDisabledNode[id]),
        disabledTag: nodeDisabledTag[id],
        disabledModularPipeline: nodeDisabledModularPipeline[id],
        disabledType: Boolean(typeDisabled[nodeType[id]]),
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
  [getNodeName, getModularPipelineName, getFontLoaded],
  (nodeName, modularPipelineName, fontLoaded) => {
    if (!fontLoaded) {
      return {};
    }
    const names = Object.values({ ...nodeName, ...modularPipelineName });
    const nodeTextWidth = {};
    const svg = select(document.body)
      .append('svg')
      .attr('class', 'kedro pipeline-node');
    svg
      .selectAll('text')
      .data(names)
      .enter()
      .append('text')
      .text((name) => name)
      .each(function (name) {
        const width = this.getBBox ? this.getBBox().width : 0;
        nodeTextWidth[name] = width;
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
    getContractedModularPipelines,
    getNodeTextWidth,
    getTextLabels,
    getFontLoaded,
  ],
  ({ node }, nodeTextWidth, textLabels, fontLoaded) => {
    if (!fontLoaded) {
      return {};
    }
    return arrayToObject(node.ids, (nodeID) => {
      const iconSize = textLabels ? 24 : 28;
      const padding = getPadding(textLabels, node.type[nodeID]);
      const textWidth = textLabels ? nodeTextWidth[node.name[nodeID]] : 0;
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
    getContractedModularPipelines,
    getNodeSize,
    getNodeRank,
    getNodeDatasetType,
  ],
  (fontLoaded, { node }, nodeSize, nodeRank, nodeDatasetType) => {
    if (!fontLoaded) {
      return [];
    }
    const nodes = node.ids.map((id) => ({
      id,
      name: node.name[id],
      label: node.name[id],
      fullName: node.fullName[id] || id,
      icon: getShortType([nodeDatasetType[id]], node.type[id]),
      type: node.type[id],
      layer: node.layer[id],
      rank: nodeRank[id],
      ...nodeSize[id],
    }));
    return nodes;
  }
);

/**
 * Returns a map of task nodeIDs to graph nodes that have parameter nodes as their source
 */

export const getNodesWithInputParams = createSelector(
  [getNodeName, getEdgeIDs, getNodeType, getEdgeSources, getEdgeTargets],
  (nodeName, edgeIDs, nodeType, edgeSources, edgeTargets) => {
    const nodesList = {};
    for (const edgeID of edgeIDs) {
      const source = edgeSources[edgeID];
      const target = edgeTargets[edgeID];
      if (nodeType[source] === 'parameters' && nodeType[target] === 'task') {
        if (!nodesList[target]) {
          nodesList[target] = [];
        }
        nodesList[target].push(nodeName[source]);
      }
    }
    return nodesList;
  }
);

/**
 * Returns a list of dataset nodes that are input and output nodes of the modular pipeline under focus mode
 */
export const getInputOutputNodesForFocusedModularPipeline = createSelector(
  [getFocusedModularPipeline, getGraphNodes, getNodeModularPipelines],
  (focusedModularPipeline, graphNodes, nodeModularPipelines) => {
    const nodesList = {};
    if (focusedModularPipeline !== null) {
      for (const nodeID in graphNodes) {
        if (
          !nodeModularPipelines[nodeID]?.includes(focusedModularPipeline?.id)
        ) {
          nodesList[nodeID] = graphNodes[nodeID];
        }
      }
    }
    return nodesList;
  }
);
