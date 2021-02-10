import 'd3-transition';
import { interpolatePath } from 'd3-interpolate-path';
import { select } from 'd3-selection';
import { curveBasis, line } from 'd3-shape';
import { paths as nodeIcons } from '../icons/node-icon';

const lineShape = line()
  .x(d => d.x)
  .y(d => d.y)
  .curve(curveBasis);

/**
 * Matches all floating point numbers in a string
 */
const matchFloats = /\d+\.\d+/g;

/**
 * Limits the precision of a float value to one decimal point
 */
const toSinglePoint = value => parseFloat(value).toFixed(1);

/**
 * Limits the precision of a path string to one decimal point
 */
const limitPrecision = path => path.replace(matchFloats, toSinglePoint);

/**
 * Render layer bands
 */
export const drawLayers = function() {
  const { layers } = this.props;

  this.el.layers = this.el.layerGroup
    .selectAll('.pipeline-layer')
    .data(layers, layer => layer.id);

  const enterLayers = this.el.layers
    .enter()
    .append('rect')
    .attr('class', 'pipeline-layer');

  this.el.layers.exit().remove();

  this.el.layers = this.el.layers.merge(enterLayers);

  this.el.layers
    .attr('x', d => d.x)
    .attr('y', d => d.y)
    .attr('height', d => d.height)
    .attr('width', d => d.width);
};

/**
 * Render layer name labels
 */
export const drawLayerNames = function() {
  const {
    chartSize: { sidebarWidth = 0 },
    layers
  } = this.props;

  this.el.layerNameGroup
    .transition('layer-names-sidebar-width')
    .duration(this.DURATION)
    .style('transform', `translateX(${sidebarWidth}px)`);

  this.el.layerNames = this.el.layerNameGroup
    .selectAll('.pipeline-layer-name')
    .data(layers, layer => layer.id);

  const enterLayerNames = this.el.layerNames
    .enter()
    .append('li')
    .attr('class', 'pipeline-layer-name');

  enterLayerNames
    .style('opacity', 0)
    .transition('enter-layer-names')
    .duration(this.DURATION)
    .style('opacity', 1);

  this.el.layerNames
    .exit()
    .style('opacity', 1)
    .transition('exit-layer-names')
    .duration(this.DURATION)
    .style('opacity', 0)
    .remove();

  this.el.layerNames = this.el.layerNames.merge(enterLayerNames);

  this.el.layerNames.text(d => d.name).attr('dy', 5);
};

/**
 * Sets the size and position of the given node rects
 */
const updateNodeRects = nodeRects =>
  nodeRects
    .attr('width', node => node.width - 5)
    .attr('height', node => node.height - 5)
    .attr('x', node => (node.width - 5) / -2)
    .attr('y', node => (node.height - 5) / -2)
    .attr('rx', node => (node.type === 'task' ? 0 : node.height / 2));

/**
 * Render node icons and name labels
 */
export const drawNodes = function(changed) {
  const {
    centralNode,
    linkedNodes,
    nodeActive,
    nodeSelected,
    nodes
  } = this.props;

  if (changed('nodes')) {
    this.el.nodes = this.el.nodeGroup
      .selectAll('.pipeline-node')
      .data(nodes, node => node.id);
  }

  if (!this.el.nodes) {
    return;
  }

  const updateNodes = this.el.nodes;
  const enterNodes = this.el.nodes.enter().append('g');
  const exitNodes = this.el.nodes.exit();
  // Filter out undefined nodes on Safari
  const allNodes = this.el.nodes
    .merge(enterNodes)
    .merge(exitNodes)
    .filter(node => typeof node !== 'undefined');

  if (changed('nodes')) {
    enterNodes
      .attr('tabindex', '0')
      .attr('class', 'pipeline-node')
      .attr('transform', node => `translate(${node.x}, ${node.y})`)
      .attr('data-id', node => node.id)
      .classed('pipeline-node--parameters', node => node.type === 'parameters')
      .classed('pipeline-node--data', node => node.type === 'data')
      .classed('pipeline-node--task', node => node.type === 'task')
      .on('click', this.handleNodeClick)
      .on('mouseover', this.handleNodeMouseOver)
      .on('mouseout', this.handleNodeMouseOut)
      .on('focus', this.handleNodeMouseOver)
      .on('blur', this.handleNodeMouseOut)
      .on('keydown', this.handleNodeKeyDown);

    enterNodes
      .attr('opacity', 0)
      .transition('show-nodes')
      .duration(this.DURATION)
      .attr('opacity', 1);

    enterNodes.append('rect');

    // Performance: use a single path per icon
    enterNodes
      .append('path')
      .attr('class', 'pipeline-node__icon')
      .attr('d', node => nodeIcons[node.type]);

    enterNodes
      .append('text')
      .attr('class', 'pipeline-node__text')
      .text(node => node.name)
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('dx', node => node.textOffset);

    exitNodes
      .transition('exit-nodes')
      .duration(this.DURATION)
      .style('opacity', 0)
      .remove();

    // Cancel exit transitions if re-entered
    updateNodes.transition('exit-nodes').style('opacity', null);

    this.el.nodes = this.el.nodeGroup.selectAll('.pipeline-node');
  }

  if (
    changed('nodes', 'nodeActive', 'nodeSelected', 'centralNode', 'linkedNodes')
  ) {
    allNodes
      .classed('pipeline-node--active', node => nodeActive[node.id])
      .classed('pipeline-node--selected', node => nodeSelected[node.id])
      .classed(
        'pipeline-node--faded',
        node => centralNode && !linkedNodes[node.id]
      );
  }

  if (changed('nodes')) {
    allNodes
      .transition('update-nodes')
      .duration(this.DURATION)
      .attr('transform', node => `translate(${node.x}, ${node.y})`)
      .on('end', () => {
        try {
          // Sort nodes so tab focus order follows X/Y position
          allNodes.sort((a, b) => a.order - b.order);
        } catch (err) {
          // Avoid rare DOM errors thrown due to timing issues
        }
      });

    enterNodes.select('rect').call(updateNodeRects);

    updateNodes
      .select('rect')
      .transition('node-rect')
      .duration(node => (node.showText ? 200 : 600))
      .call(updateNodeRects);

    // Performance: icon transitions with CSS on GPU
    allNodes
      .select('.pipeline-node__icon')
      .style('transition-delay', node => (node.showText ? '0ms' : '200ms'))
      .style(
        'transform',
        node =>
          `translate(${node.iconOffset}px, ${-node.iconSize / 2}px) ` +
          `scale(${node.iconSize / 24})`
      );

    // Performance: text transitions with CSS on GPU
    allNodes
      .select('.pipeline-node__text')
      .style('transition-delay', node => (node.showText ? '200ms' : '0ms'))
      .style('opacity', node => (node.showText ? 1 : 0));
  }
};

/**
 * Render edge lines
 */
export const drawEdges = function(changed) {
  const { edges, centralNode, linkedNodes } = this.props;

  if (changed('edges')) {
    this.el.edges = this.el.edgeGroup
      .selectAll('.pipeline-edge')
      .data(edges, edge => edge.id);
  }

  if (!this.el.edges) {
    return;
  }

  const updateEdges = this.el.edges;
  const enterEdges = this.el.edges.enter().append('g');
  const exitEdges = this.el.edges.exit();
  const allEdges = this.el.edges.merge(enterEdges).merge(exitEdges);

  if (changed('edges')) {
    enterEdges
      .append('path')
      .attr('marker-end', d => `url(#pipeline-arrowhead)`);

    enterEdges.attr('data-id', edge => edge.id).attr('class', 'pipeline-edge');

    enterEdges
      .attr('opacity', 0)
      .transition('show-edges')
      .duration(this.DURATION)
      .attr('opacity', 1);

    exitEdges
      .transition('exit-edges')
      .duration(this.DURATION)
      .style('opacity', 0)
      .remove();

    // Cancel exit transitions if re-entered
    updateEdges.transition('exit-edges').style('opacity', null);

    allEdges
      .select('path')
      .transition('update-edges')
      .duration(this.DURATION)
      .attrTween('d', function(edge) {
        // Performance: Limit path precision for parsing & render
        let current = edge.points && limitPrecision(lineShape(edge.points));
        const previous = select(this).attr('d') || current;
        return interpolatePath(previous, current);
      });

    this.el.edges = this.el.edgeGroup.selectAll('.pipeline-edge');
  }

  if (changed('edges', 'centralNode', 'linkedNodes')) {
    allEdges.classed(
      'pipeline-edge--faded',
      edge =>
        edge &&
        centralNode &&
        (!linkedNodes[edge.source] || !linkedNodes[edge.target])
    );
  }
};
