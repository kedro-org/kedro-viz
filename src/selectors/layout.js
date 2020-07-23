import { createSelector } from 'reselect';
import { getVisibleNodes } from './nodes';
import { getVisibleEdges } from './edges';
import { getVisibleLayerIDs } from './disabled';
import { sidebarBreakpoint, sidebarWidth } from '../config';

const getGraphSize = state => state.graph.size || {};
const getNewgraphFlag = state => state.flags.newgraph;
const getHasVisibleLayers = state =>
  state.visible.layers && Boolean(state.layer.ids.length);
const getVisibleSidebar = state => state.visible.sidebar;
const getFontLoaded = state => state.fontLoaded;

/**
 * Select a subset of state that is watched by graph layout calculators
 * and used to prepare state.graph via async web worker actions
 */
export const getGraphInput = createSelector(
  [
    getVisibleNodes,
    getVisibleEdges,
    getVisibleLayerIDs,
    getHasVisibleLayers,
    getNewgraphFlag,
    getFontLoaded
  ],
  (nodes, edges, layers, showLayers, newgraph, fontLoaded) => {
    if (!fontLoaded) {
      return null;
    }
    return { nodes, edges, layers: showLayers && layers, newgraph, fontLoaded };
  }
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

// Check that width & height props are present and finite
const isFinite = n => typeof n !== 'undefined' && Number.isFinite(n);
const isValid = d => isFinite(d.width) && isFinite(d.height);

/**
 * Get chart zoom translation/scale,
 * by comparing native graph width/height to container width/height
 */
export const getZoomPosition = createSelector(
  [getGraphSize, getChartSize],
  (graph, chart) => {
    if (!isValid(graph) || !isValid(chart)) {
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
