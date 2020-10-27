import { createSelector } from 'reselect';
import { getVisibleNodes } from './nodes';
import { getVisibleEdges } from './edges';
import { getVisibleLayerIDs } from './disabled';
import { getVisibleMetaSidebar } from '../selectors/metadata';
import { chartMinWidth, sidebarWidth, metaSidebarWidth } from '../config';

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
export const getSidebarWidth = visibleSidebar =>
  visibleSidebar ? sidebarWidth.open : sidebarWidth.closed;

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

    // Get the actual sidebar width
    const sidebarWidth = getSidebarWidth(visibleSidebar);
    const metaSidebarWidth = getMetaSidebarWidth(visibleMetaSidebar);

    // Find the resulting space for the chart
    const chartWidth = width - sidebarWidth - metaSidebarWidth;

    // Chart size excludes sidebars when space is small
    const excludeSidebars = width < chartMinWidth;

    return {
      left,
      top,
      outerWidth: width,
      outerHeight: height,
      height,
      width: excludeSidebars ? width : chartWidth,
      sidebarWidth: excludeSidebars ? 0 : sidebarWidth,
      metaSidebarWidth: excludeSidebars ? 0 : metaSidebarWidth
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
