import { createSelector } from 'reselect';
import dagre from 'dagre';
import batchingToposort from 'batching-toposort';
import { getNodeActive, getVisibleNodes } from './nodes';
import { getVisibleEdges } from './edges';

const getLayerIDs = state => state.layer.ids;
const getHasLayers = state =>
  state.visible.layers && Boolean(state.layer.ids.length);
const getNodeType = state => state.node.type;
const getNodeLayer = state => state.node.layer;
const getVisibleSidebar = state => state.visible.sidebar;

/**
 * Get list of visible nodes for each visible layer
 */
export const getLayerNodes = createSelector(
  [getVisibleNodes, getLayerIDs],
  (nodes, layerIDs) => {
    // Create object containing a list of every node for each layer
    const layerNodes = {};
    for (const node of nodes) {
      if (!layerNodes[node.layer]) {
        layerNodes[node.layer] = [];
      }
      layerNodes[node.layer].push(node.id);
    }

    // Convert into an ordered list, and filter out the unused layers
    const visibleLayerNodes = [];
    for (const layerID of layerIDs) {
      if (layerNodes[layerID]) {
        visibleLayerNodes.push(layerNodes[layerID]);
      }
    }

    return visibleLayerNodes;
  }
);

/**
 * Calculate ranks (vertical placement) for each node,
 * by toposorting while taking layers into account
 */
export const getRanks = createSelector(
  [getVisibleNodes, getVisibleEdges, getLayerNodes],
  (nodes, edges, layerNodes) => {
    // For each node, create a list of nodes that depend on that node
    const nodeDeps = {};

    // Initialise empty dependency arrays for each node
    for (const node of nodes) {
      nodeDeps[node.id] = [];
    }

    // Add dependencies for visible edges
    for (const edge of edges) {
      nodeDeps[edge.source].push(edge.target);
    }

    // Add "false edge" dependencies for layered nodes to prevent layer overlaps
    for (let i = 1; i < layerNodes.length; i++) {
      for (const sourceID of layerNodes[i - 1]) {
        for (const targetID of layerNodes[i]) {
          nodeDeps[sourceID].push(targetID);
        }
      }
    }

    // Run toposort algorithm to rank nodes by dependency
    const toposortedNodes = batchingToposort(nodeDeps);

    // Convert toposort order into rank numbering
    const nodeRanks = {};
    for (let rank = 0; rank < toposortedNodes.length; rank++) {
      for (const nodeID of toposortedNodes[rank]) {
        nodeRanks[nodeID] = rank;
      }
    }

    return nodeRanks;
  }
);

/**
 * Calculate chart layout with Dagre.js.
 * This is an extremely expensive operation so we want it to run as infrequently
 * as possible, and keep it separate from other properties (like node.active)
 * which don't affect layout.
 */
export const getGraph = createSelector(
  [getVisibleNodes, getVisibleEdges, getRanks, getHasLayers],
  (nodes, edges, ranks, hasLayers) => {
    const ranker = hasLayers ? 'none' : null;
    const graph = new dagre.graphlib.Graph().setGraph({
      ranker: hasLayers ? ranker : null,
      ranksep: hasLayers ? 200 : 70,
      marginx: 40,
      marginy: 40
    });

    nodes.forEach(node => {
      graph.setNode(node.id, { ...node, rank: ranks[node.id] });
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
    graph.nodes().map(nodeID => {
      const node = graph.node(nodeID);
      return Object.assign({}, node, {
        layer: nodeLayer[nodeID],
        type: nodeType[nodeID],
        order: node.x + node.y * 9999,
        active: nodeActive[nodeID]
      });
    })
);

/**
 * Reformat edge data for use on the chart
 */
export const getLayoutEdges = createSelector(
  [getGraph],
  graph => graph.edges().map(edge => Object.assign({}, graph.edge(edge)))
);

/**
 * Get width, height and margin of graph
 */
export const getGraphSize = createSelector(
  [getGraph],
  graph => graph.graph()
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
    if (!Object.keys(chart).length) {
      return {};
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
