import { createSelector } from 'reselect';
import { getVisibleNodes } from './nodes';
import { getVisibleEdges } from './edges';
import { getVisibleLayerIDs } from './disabled';
import { getVisibleMetaSidebar } from '../selectors/metadata';
import { sidebarBreakpoint, sidebarWidth, metaSidebarWidth } from '../config';

const getNewgraphFlag = state => state.flags.newgraph;
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
    getNewgraphFlag,
    getFontLoaded
  ],
  (nodes, edges, layers, newgraph, fontLoaded) => {
    if (!fontLoaded) {
      return null;
    }
    return { nodes, edges, layers, newgraph, fontLoaded };
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
 * Return the displayed width of the meta sidebar
 */
export const getMetaSidebarWidth = visibleMetaSidebar =>
  visibleMetaSidebar ? metaSidebarWidth.open : metaSidebarWidth.closed;

/**
 * Convert the DOMRect into an Object, mutate some of the properties,
 * and add some useful new ones
 */
export const getChartSize = createSelector(
  [getVisibleSidebar, getVisibleMetaSidebar, state => state.chartSize],
  (visibleSidebar, visibleMetaSidebar, chartSize) => {
    const { left, top, width, height } = chartSize;
    if (!width || !height) {
      return {};
    }
    const sidebarWidth = getSidebarWidth(visibleSidebar, width);
    const metaSidebarWidth = getMetaSidebarWidth(visibleMetaSidebar);
    return {
      left,
      top,
      outerWidth: width,
      outerHeight: height,
      width: width - sidebarWidth - metaSidebarWidth,
      height,
      sidebarWidth,
      metaSidebarWidth
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
