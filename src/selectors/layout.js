import { createSelector } from 'reselect';
import { select } from 'd3-selection';
import dagre from 'dagre';
import { getNodeActive, getVisibleNodes } from './nodes';
import { getVisibleEdges } from './edges';

const getTextLabels = state => state.textLabels;
const getNodeType = state => state.nodeType;
const getChartSize = state => state.chartSize;

/**
 * Calculate chart layout with Dagre.js.
 * This is an extremely expensive operation so we want it to run as infrequently
 * as possible, and keep it separate from other properties (like node.active)
 * which don't affect layout.
 */
export const getGraph = createSelector(
  [getVisibleNodes, getVisibleEdges, getTextLabels],
  (nodes, edges, textLabels) => {

    const graph = new dagre.graphlib.Graph().setGraph({
      marginx: 40,
      marginy: 40
    });

    // Temporarily append text element to the DOM, to measure its width
    const nodeGroup = textLabels ? select('#nodes') : null;
    const textWidth = (name, padding) => {
      const text = nodeGroup.append('text').text(name);
      const bbox = text.node().getBBox();
      text.remove();
      return bbox.width + padding;
    };

    const getNodeSize = (node) => {
      const boxSize = node.type === 'data' ? 50 : 40;
      return {
        height: boxSize,
        width: textLabels ? textWidth(node.name, boxSize) : boxSize,
      };
    };

    nodes.forEach(node => {
      graph.setNode(node.id, {
        ...node,
        ...getNodeSize(node),
        label: node.name,
      });
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
 * Reformat data for use on the chart,
 * and recombine with other data that doesn't affect layout
 */
export const getLayout = createSelector(
  [getGraph, getNodeType, getNodeActive],
  (graph, nodeType, nodeActive) => ({
    nodes: graph.nodes()
      .map(node => Object.assign({}, graph.node(node), {
        type: nodeType[node],
        active: nodeActive[node],
      })),
    edges: graph.edges().map(edge => graph.edge(edge)),
  })
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
      chart.height,
    ].every(n => !isNaN(n) && Number.isFinite(n));
    
    if (validDimensions) {
      const scale = Math.min(
        container.width / chart.width,
        container.height / chart.height
      );
      return {
        scale,
        translateX: container.width / 2 - chart.width * scale / 2,
        translateY: container.height / 2 - chart.height * scale / 2,
      };
    }
    return {
      scale: 1,
      translateX: 0,
      translateY: 0,
    };
  }
);