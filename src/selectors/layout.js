import { createSelector } from 'reselect';
import dagre from 'dagre';
import { getNodeActive, getVisibleNodes } from './nodes';
import { getVisibleEdges } from './edges';

const getHasVisibleLayers = state =>
  state.visible.layers && Boolean(state.layer.ids.length);
const getNodeType = state => state.node.type;
const getNodeLayer = state => state.node.layer;
const getVisibleSidebar = state => state.visible.sidebar;

/**
 * Calculate chart layout with Dagre.js.
 * This is an extremely expensive operation so we want it to run as infrequently
 * as possible, and keep it separate from other properties (like node.active)
 * which don't affect layout.
 */
export const getGraph = createSelector(
  [getVisibleNodes, getVisibleEdges, getHasVisibleLayers],
  (nodes, edges, hasVisibleLayers) => {
    if (!nodes.length || !edges.length) {
      return;
    }

    const ranker = hasVisibleLayers ? 'none' : null;
    const graph = new dagre.graphlib.Graph().setGraph({
      ranker: hasVisibleLayers ? ranker : null,
      ranksep: hasVisibleLayers ? 200 : 70,
      marginx: 40,
      marginy: 40
    });

    nodes.forEach(node => {
      graph.setNode(node.id, node);
    });

    edges.forEach(edge => {
      graph.setEdge(edge.source, edge.target, edge);
    });

    // Run Dagre layout to calculate X/Y positioning
    dagre.layout(graph);

    return graph;
  }
);

/**
 * Reformat node data for use on the chart,
 * and recombine with other data that doesn't affect layout
 */
export const getLayoutNodes = createSelector(
  [getGraph, getNodeType, getNodeLayer, getNodeActive],
  (graph, nodeType, nodeLayer, nodeActive) =>
    graph
      ? graph.nodes().map(nodeID => {
          const node = graph.node(nodeID);
          return Object.assign({}, node, {
            layer: nodeLayer[nodeID],
            type: nodeType[nodeID],
            order: node.x + node.y * 9999,
            active: nodeActive[nodeID]
          });
        })
      : []
);

/**
 * Reformat edge data for use on the chart
 */
export const getLayoutEdges = createSelector(
  [getGraph],
  graph =>
    graph ? graph.edges().map(edge => Object.assign({}, graph.edge(edge))) : []
);

/**
 * Get width, height and margin of graph
 */
export const getGraphSize = createSelector(
  [getGraph],
  graph => (graph ? graph.graph() : {})
);

/**
 * Return the displayed width of the sidebar
 */
export const getSidebarWidth = (visibleSidebar, outerChartWidth) => {
  const defaultSidebarWidth = 300; // from _variables.scss
  const breakpointSmall = 480; // from _variables.scss
  if (visibleSidebar && outerChartWidth > breakpointSmall) {
    return defaultSidebarWidth;
  }
  return 0;
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
