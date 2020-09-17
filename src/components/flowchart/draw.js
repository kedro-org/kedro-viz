import 'd3-transition';
import { interpolatePath } from 'd3-interpolate-path';
import { select } from 'd3-selection';
import { curveBasis, line } from 'd3-shape';
import icon from './icon';

const lineShape = line()
  .x(d => d.x)
  .y(d => d.y)
  .curve(curveBasis);

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
    .attr('class', 'pipeline-layer-name')
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
 * Render node icons and name labels
 */
export const drawNodes = function(changed) {
  const {
    centralNode,
    linkedNodes,
    nodeActive,
    nodeSelected,
    nodes,
    textLabels
  } = this.props;

  if (changed('nodes')) {
    this.el.nodes = this.el.nodeGroup
      .selectAll('.pipeline-node')
      .data(nodes, node => node.id);
  }

  if (!this.el.nodes) {
    return;
  }

  const enterNodes = this.el.nodes.enter().append('g');
  const exitNodes = this.el.nodes.exit();
  const allNodes = this.el.nodes.merge(enterNodes).merge(exitNodes);

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
    enterNodes.append(icon);

    enterNodes
      .append('text')
      .text(node => node.name)
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('dx', node => node.textOffset);

    exitNodes
      .transition('exit-nodes')
      .duration(this.DURATION)
      .style('opacity', 0)
      .remove();

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

  if (changed('nodes', 'textLabels')) {
    allNodes
      .classed('pipeline-node--icon', !textLabels)
      .classed('pipeline-node--text', textLabels);

    allNodes
      .transition('update-nodes')
      .duration(this.DURATION)
      .attr('transform', node => `translate(${node.x}, ${node.y})`)
      .end()
      .catch(() => {})
      .finally(() => {
        // Sort nodes so tab focus order follows X/Y position
        allNodes.sort((a, b) => a.order - b.order);
      });

    allNodes
      .select('rect')
      .transition('node-rect')
      .duration(textLabels ? 200 : 600)
      .attr('width', node => node.width - 5)
      .attr('height', node => node.height - 5)
      .attr('x', node => (node.width - 5) / -2)
      .attr('y', node => (node.height - 5) / -2)
      .attr('rx', node => (node.type === 'task' ? 0 : node.height / 2));

    allNodes
      .select('.pipeline-node__icon')
      .transition('node-icon-offset')
      .duration(200)
      .attr('width', node => node.iconSize)
      .attr('height', node => node.iconSize)
      .attr('x', node => node.iconOffset)
      .attr('y', node => node.iconSize / -2);
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

    allEdges
      .select('path')
      .transition('update-edges')
      .duration(this.DURATION)
      .attrTween('d', function(edge) {
        const current = edge.points && lineShape(edge.points);
        const previous = select(this).attr('d') || current;
        return interpolatePath(previous, current);
      });

    this.el.edges = this.el.edgeGroup.selectAll('.pipeline-edge');
  }

  if (changed('edges', 'centralNode', 'linkedNodes')) {
    allEdges.classed(
      'pipeline-edge--faded',
      ({ source, target }) =>
        centralNode && (!linkedNodes[source] || !linkedNodes[target])
    );
  }
};
