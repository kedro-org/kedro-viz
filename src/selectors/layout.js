import { createSelector } from 'reselect';
import { getCurrentFlags } from './flags';
import { getVisibleNodes } from './nodes';
import { getVisibleEdges } from './edges';
import { getVisibleLayerIDs } from './disabled';
import { sidebarBreakpoint, sidebarWidth } from '../config';

const getGraph = state => state.graph;
const getHasVisibleLayers = state =>
  state.visible.layers && Boolean(state.layer.ids.length);
const getNodeType = state => state.node.type;
const getNodeLayer = state => state.node.layer;
const getVisibleSidebar = state => state.visible.sidebar;
const getFontLoaded = state => state.fontLoaded;

/**
 * Calculate chart layout. Algorithm used is dependent on flags
 */
export const getGraphInput = createSelector(
  [
    getVisibleNodes,
    getVisibleEdges,
    getVisibleLayerIDs,
    getHasVisibleLayers,
    getCurrentFlags,
    getFontLoaded
  ],
  (nodes, edges, layers, showLayers, flags, fontLoaded) => {
    if (!fontLoaded || !nodes.length || !edges.length) {
      return null;
    }
    return { nodes, edges, layers, showLayers, flags, fontLoaded };
  }
);

/**
 * Reformat node data for use on the chart,
 * and recombine with other data that doesn't affect layout
 */
export const getLayoutNodes = createSelector(
  [getGraph, getNodeType, getNodeLayer],
  (graph, nodeType, nodeLayer) =>
    graph
      ? graph.nodes.map(node => {
          return Object.assign({}, node, {
            layer: nodeLayer[node.id],
            type: nodeType[node.id],
            order: node.x + node.y * 9999
          });
        })
      : []
);

/**
 * Reformat edge data for use on the chart
 */
export const getLayoutEdges = createSelector(
  [getGraph],
  graph => (graph ? graph.edges : [])
);

/**
 * Get width, height and margin of graph
 */
export const getGraphSize = createSelector(
  [getGraph],
  graph => (graph ? graph.graph : {})
);

/**
 * Return the displayed width of the sidebar
 */
export const getSidebarWidth = (visibleSidebar, outerChartWidth) => {
  if (visibleSidebar && outerChartWidth > sidebarBreakpoint) {
    return sidebarWidth.open;
  }
  return sidebarWidth.closed;
};

/**
 * Convert the DOMRect into an Object, mutate some of the properties,
 * and add some useful new ones
 */
export const getChartSize = createSelector(
  [getVisibleSidebar, state => state.chartSize],
  (visibleSidebar, chartSize) => {
    const { left, top, width, height } = chartSize;
    if (!width || !height) {
      return {};
    }
    const sidebarWidth = getSidebarWidth(visibleSidebar, width);
    return {
      left,
      top,
      outerWidth: width,
      outerHeight: height,
      width: width - sidebarWidth,
      height,
      sidebarWidth
    };
  }
);

/**
 * Get chart zoom translation/scale,
 * by comparing native graph width/height to container width/height
 */
export const getZoomPosition = createSelector(
  [getGraphSize, getChartSize],
  (graph, chart) => {
    if (!chart.width || !graph.width) {
      return {
        scale: 1,
        translateX: 0,
        translateY: 0
      };
    }

    const scale = Math.min(
      chart.width / graph.width,
      chart.height / graph.height
    );
    const translateX = chart.width / 2 - (graph.width * scale) / 2;
    const translateY = chart.height / 2 - (graph.height * scale) / 2;

    return {
      scale,
      translateX: translateX + chart.sidebarWidth,
      translateY
    };
  }
);
