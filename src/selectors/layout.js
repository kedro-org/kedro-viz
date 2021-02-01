import { createSelector } from 'reselect';
import { getVisibleNodes } from './nodes';
import { getVisibleEdges } from './edges';
import { getVisibleLayerIDs } from './disabled';
import { getVisibleMetaSidebar } from '../selectors/metadata';
import { sidebarWidth, metaSidebarWidth, chartMinWidthScale } from '../config';

const getOldgraphFlag = state => state.flags.oldgraph;
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
    getOldgraphFlag,
    getFontLoaded
  ],
  (nodes, edges, layers, oldgraph, fontLoaded) => {
    if (!fontLoaded) {
      return null;
    }
    return { nodes, edges, layers, oldgraph, fontLoaded };
  }
);

/**
 * Calculate the displayed width of a sidebar
 */
export const getSidebarWidth = (visible, { open, closed }) =>
  visible ? open : closed;

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
    const sidebarWidthActual = getSidebarWidth(visibleSidebar, sidebarWidth);
    const metaSidebarWidthActual = getSidebarWidth(
      visibleMetaSidebar,
      metaSidebarWidth
    );

    // Find the resulting space for the chart
    const chartWidth = width - sidebarWidthActual - metaSidebarWidthActual;

    return {
      left,
      top,
      outerWidth: width,
      outerHeight: height,
      height,
      width: chartWidth,
      minWidthScale: chartMinWidthScale,
      sidebarWidth: sidebarWidthActual,
      metaSidebarWidth: metaSidebarWidthActual
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
