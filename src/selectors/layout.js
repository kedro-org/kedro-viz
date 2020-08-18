import { createSelector } from 'reselect';
import { getVisibleNodes } from './nodes';
import { getVisibleEdges } from './edges';
import { getVisibleLayerIDs } from './disabled';
import { sidebarBreakpoint, sidebarWidth } from '../config';

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

/**
 * Gets the current chart zoom
 */
export const getChartZoom = createSelector(
  [state => state.zoom],
  zoom => ({
    ...zoom
  })
);
