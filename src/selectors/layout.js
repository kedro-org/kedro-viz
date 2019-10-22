import { createSelector } from 'reselect';
import dagre from 'dagre';
import { getNodeActive, getVisibleNodes } from './nodes';
import { getVisibleEdges } from './edges';

const getNodeType = state => state.nodeType;
const getChartSize = state => state.chartSize;

/**
 * Calculate chart layout with Dagre.js.
 * This is an extremely expensive operation so we want it to run as infrequently
 * as possible, and keep it separate from other properties (like node.active)
 * which don't affect layout.
 */
export const getGraph = createSelector(
  [getVisibleNodes, getVisibleEdges],
  (nodes, edges) => {
    const graph = new dagre.graphlib.Graph().setGraph({
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
  [getGraph, getNodeType, getNodeActive],
  (graph, nodeType, nodeActive) =>
    graph.nodes().map(nodeID => {
      const node = graph.node(nodeID);
      return Object.assign({}, node, {
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
 * Get chart zoom translation/scale,
 * by comparing native graph width/height to container width/height
 */
export const getZoomPosition = createSelector(
  [getGraph, getChartSize],
  (graph, container) => {
    const chart = graph.graph();
    const validDimensions = [
      container.width,
      container.height,
      chart.width,
      chart.height
    ].every(n => !isNaN(n) && Number.isFinite(n));

    if (validDimensions) {
      const scale = Math.min(
        container.width / chart.width,
        container.height / chart.height
      );
      return {
        scale,
        translateX: container.width / 2 - (chart.width * scale) / 2,
        translateY: container.height / 2 - (chart.height * scale) / 2
      };
    }
    return {
      scale: 1,
      translateX: 0,
      translateY: 0
    };
  }
);
