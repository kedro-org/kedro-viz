import { createSelector } from 'reselect';
import { select } from 'd3-selection';
import dagre from 'dagre';
import { getNodeActive, getVisibleNodes } from './nodes';
import { getVisibleEdges } from './edges';

const getTextLabels = state => state.textLabels;
const getNodeType = state => state.nodeType;
const getChartSize = state => state.chartSize;

/**
 * Add DOM container for checking text widths
 * @param {Boolean} hasTextLabels Whether text labels are
 * @return {object|undefined} D3 element, or nothing
 */
export const prepareTextContainer = hasTextLabels => {
  if (!hasTextLabels) {
    return;
  }
  return select('body')
    .append('svg')
    .attr('class', 'kedro node');
};

/**
 * Temporarily append text element to the DOM, to measure its width
 * @param {string} name Node name
 * @param {Object} svg D3 container
 * @return {number} Node width
 */
export const getTextWidth = (name, svg) => {
  if (!svg) {
    return 0;
  }
  const text = svg.append('text').text(name);
  const node = text.node();
  const width = node ? node.getBBox().width : 0;
  text.remove();
  return width;
};

/**
 * Calculate the width and height of a node container
 * @param {Object} node Datum object
 * @param {Object} svg D3 element wrapper
 * @return {Object} width and height
 */
export const getNodeSize = (node, svg) => {
  const showLabels = Boolean(svg);
  const iconSize = showLabels ? 14 : 24;
  const getPadding = () => {
    if (showLabels) {
      return { x: 16, y: 10 };
    }
    if (node.type === 'task') {
      return { x: 14, y: 14 };
    }
    return { x: 16, y: 16 };
  };
  const padding = getPadding();
  const textWidth = showLabels ? getTextWidth(node.name, svg) : 0;
  const textGap = showLabels ? 4 : 0;
  const innerWidth = iconSize + textWidth + textGap;
  const height = iconSize + padding.y * 2;
  const width = innerWidth + padding.x * 2;
  const textOffset = (innerWidth - textWidth) / 2;
  const iconOffset = -innerWidth / 2;

  return {
    width,
    height,
    iconSize,
    textWidth,
    padding,
    textGap,
    textOffset,
    iconOffset
  };
};

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

    const svg = prepareTextContainer(textLabels);

    nodes.forEach(node => {
      graph.setNode(node.id, {
        ...node,
        ...getNodeSize(node, svg),
        label: node.name
      });
    });

    edges.forEach(edge => {
      graph.setEdge(edge.source, edge.target, edge);
    });

    // Run Dagre layout to calculate X/Y positioning
    dagre.layout(graph);

    // Tidy up leftover DOM container
    if (svg) {
      svg.remove();
    }

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
    nodes: graph.nodes().map(nodeID => {
      const node = graph.node(nodeID);
      return Object.assign({}, node, {
        type: nodeType[nodeID],
        order: node.x + node.y * 9999,
        active: nodeActive[nodeID]
      });
    }),
    edges: graph.edges().map(edge => graph.edge(edge))
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
