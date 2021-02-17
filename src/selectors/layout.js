import { createSelector } from 'reselect';
import { getVisibleNodes } from './nodes';
import { getVisibleEdges } from './edges';
import { getVisibleLayerIDs } from './disabled';
import { getVisibleMetaSidebar } from '../selectors/metadata';
import {
  sidebarWidth,
  metaSidebarWidth,
  chartMinWidthScale,
  largeGraphThreshold,
  codeSidebarWidth,
} from '../config';

const getOldgraphFlag = (state) => state.flags.oldgraph;
const getVisibleSidebar = (state) => state.visible.sidebar;
const getVisibleCode = (state) => state.visible.code;
const getFontLoaded = (state) => state.fontLoaded;
const getIgnoreLargeWarning = (state) => state.ignoreLargeWarning;
const getGraphHasNodes = (state) => Boolean(state.graph?.nodes?.length);
const getChartSizeState = (state) => state.chartSize;

/**
 * Decide whether to show the large graph warning
 */
export const getTriggerLargeGraphWarning = createSelector(
  [getVisibleNodes, getVisibleEdges, getIgnoreLargeWarning, getGraphHasNodes],
  (nodes, edges, ignoreLargeWarning, graphHasNodes) =>
    nodes.length + 1.5 * edges.length > largeGraphThreshold &&
    !ignoreLargeWarning &&
    !graphHasNodes
);

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
    getFontLoaded,
    getTriggerLargeGraphWarning,
  ],
  (nodes, edges, layers, oldgraph, fontLoaded, triggerLargeGraphWarning) => {
    if (!fontLoaded || triggerLargeGraphWarning) {
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
  [getVisibleSidebar, getVisibleMetaSidebar, getVisibleCode, getChartSizeState],
  (visibleSidebar, visibleMetaSidebar, visibleCodeSidebar, chartSize) => {
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
    const codeSidebarWidthActual = getSidebarWidth(
      visibleCodeSidebar,
      codeSidebarWidth
    );

    // Find the resulting space for the chart
    let chartWidth =
      width -
      sidebarWidthActual -
      metaSidebarWidthActual -
      codeSidebarWidthActual;

    return {
      left,
      top,
      outerWidth: width,
      outerHeight: height,
      height,
      width: chartWidth,
      minWidthScale: chartMinWidthScale,
      sidebarWidth: sidebarWidthActual,
      metaSidebarWidth: metaSidebarWidthActual,
      codeSidebarWidth: codeSidebarWidthActual,
    };
  }
);

/**
 * Gets the current chart zoom
 */
export const getChartZoom = createSelector([(state) => state.zoom], (zoom) => ({
  ...zoom,
}));
