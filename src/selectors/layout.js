import { createSelector } from 'reselect';
import dagre from 'dagre';
import { getNodeActive, getVisibleNodes } from './nodes';
import { getVisibleEdges } from './edges';

const getTextLabels = state => state.textLabels;
const getNodeType = state => state.nodeType;
const getChartSize = state => state.chartSize;
const getNodeTextBBox = state => state.nodeTextBBox;

/**
 * Calculate the width and height of a node container
 * @param {Object} node Datum object
 * @param {Object} svg D3 element wrapper
 * @param {Object} bbox SVGRect node dimensions
 * @return {Object} width and height
 */
export const getNodeSize = (node, textLabels, bbox) => {
  if (textLabels) {
    const boxSize = 40;
    const textWidth = bbox ? bbox.width : 0;
    return {
      height: boxSize,
      width: textWidth + boxSize
    };
  }
  const boxSize = node.type === 'task' ? 50 : 55;
  return {
    height: boxSize,
    width: boxSize
  };
};

/**
 * Calculate chart layout with Dagre.js.
 * This is an extremely expensive operation so we want it to run as infrequently
 * as possible, and keep it separate from other properties (like node.active)
 * which don't affect layout.
 */
export const getGraph = createSelector(
  [getVisibleNodes, getVisibleEdges, getTextLabels, getNodeTextBBox],
  (nodes, edges, textLabels, nodeTextBBox) => {
    const graph = new dagre.graphlib.Graph().setGraph({
      marginx: 40,
      marginy: 40
    });

    nodes.forEach(node => {
      const size = getNodeSize(node, textLabels, nodeTextBBox[node.id]);
      graph.setNode(
        node.id,
        Object.assign({}, node, size, {
          label: node.name
        })
      );
    });

    edges.forEach(edge => {
      graph.setEdge(edge.source, edge.target, edge);
    });

    // Run Dagre layout to calculate X/Y positioning
    // but only if all text widths have been calculated
    if (nodes.every(node => nodeTextBBox[node.id])) {
      dagre.layout(graph);
    }

    return graph;
  }
);

/**
 * Sort nodes by X/Y coords (with Y taking precedence),
 * so that their tabindexes are in the correct order for keyboard users
 * @param {Object} node Datum
 */
const nodeTabIndex = node => node.x + node.y * 9999;

/**
 * Reformat data for use on the chart,
 * and recombine with other data that doesn't affect layout
 */
export const getLayout = createSelector(
  [getGraph, getNodeType, getNodeActive],
  (graph, nodeType, nodeActive) => ({
    nodes: graph
      .nodes()
      .map(nodeID => {
        const node = graph.node(nodeID);
        return Object.assign({}, node, {
          type: nodeType[nodeID],
          active: nodeActive[nodeID]
        });
      })
      .sort((a, b) => nodeTabIndex(a) - nodeTabIndex(b)),
    edges: graph.edges().map(edgeID => Object.assign({}, graph.edge(edgeID)))
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
