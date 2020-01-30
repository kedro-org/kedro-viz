import 'd3-transition';
import { interpolatePath } from 'd3-interpolate-path';
import { select } from 'd3-selection';
import { curveBasis, line } from 'd3-shape';
import icon from './icon';

/**
 * Render chart to the DOM with D3
 */
const draw = function() {
  const { nodes, edges, centralNode, linkedNodes, textLabels } = this.props;

  // Create selections
  this.el.edges = this.el.edgeGroup
    .selectAll('.edge')
    .data(edges, edge => edge.id);

  this.el.nodes = this.el.nodeGroup
    .selectAll('.node')
    .data(nodes, node => node.id);

  // Set up line shape function
  const lineShape = line()
    .x(d => d.x)
    .y(d => d.y)
    .curve(curveBasis);

  // Create edges
  const enterEdges = this.el.edges
    .enter()
    .append('g')
    .attr('class', 'edge')
    .attr('opacity', 0);

  enterEdges
    .append('path') //.attr('marker-end', 'url(#arrowhead)')
    .attr('id', edge => 'curve_' + edge.id);

  // this.el.edges.exit();

  const labelEdges = this.el.edges
    .enter()
    .append('text')
    .attr('x', 0)
    .attr('dy', -3.5)
    .append('textPath')
    .attr('font-weight', 'bold')
    .attr('font-size', '8px')
    .attr('text-anchor', 'middle')
    .attr('startOffset', '50%')
    .attr('xlink:href', edge => '#curve_' + edge.id)
    .text(edge => {
      for (let n = 0; n < nodes.length; n++) {
        if (nodes[n].id === edge.target) {
          return nodes[n].size ? nodes[n].size.toLocaleString() : '';
        }
      }
    });

  this.el.edges
    .exit()
    .transition('exit-edges')
    .duration(this.DURATION)
    .attr('opacity', 0)
    .remove();

  this.el.edges = this.el.edges.merge(enterEdges);
  this.el.edges = this.el.edges.merge(labelEdges);

  this.el.edges
    .attr('data-id', edge => edge.id)
    .classed(
      'edge--faded',
      ({ source, target }) =>
        centralNode && (!linkedNodes[source] || !linkedNodes[target])
    )
    .transition('show-edges')
    .duration(this.DURATION)
    .attr('opacity', 1);

  this.el.edges
    .select('path')
    .transition('update-edges')
    .duration(this.DURATION)
    .attrTween('d', function(edge) {
      if (edge.points[0].x > edge.points[2].x) {
        edge.points.reverse();
      }
      const current = edge.points && lineShape(edge.points);
      const previous = select(this).attr('d') || current;
      return interpolatePath(previous, current);
    });

  // Create nodes
  const enterNodes = this.el.nodes
    .enter()
    .append('g')
    .attr('tabindex', '0')
    .attr('class', 'node');

  enterNodes
    .attr('transform', node => `translate(${node.x}, ${node.y})`)
    .attr('opacity', 0);

  enterNodes.append('rect').classed('sized', node => !!node.size);

  enterNodes.append(icon);

  enterNodes
    .append('text')
    .text(node => node.name)
    .attr('text-anchor', 'middle')
    .attr('dy', 3.5)
    .attr('dx', node => node.textOffset);

  this.el.nodes
    .exit()
    .transition('exit-nodes')
    .duration(this.DURATION)
    .attr('opacity', 0)
    .remove();

  this.el.nodes = this.el.nodes
    .merge(enterNodes)
    .attr('data-id', node => node.id)
    .classed('node--parameters', node => node.type === 'parameters')
    .classed('node--data', node => node.type === 'data')
    .classed('node--task', node => node.type === 'task')
    .classed('node--icon', !textLabels)
    .classed('node--text', textLabels)
    .classed('node--active', node => node.active)
    .classed('node--highlight', node => centralNode && linkedNodes[node.id])
    .classed('node--faded', node => centralNode && !linkedNodes[node.id])
    .on('click', this.handleNodeClick)
    .on('mouseover', this.handleNodeMouseOver)
    .on('mouseout', this.handleNodeMouseOut)
    .on('focus', this.handleNodeMouseOver)
    .on('blur', this.handleNodeMouseOut)
    .on('keydown', this.handleNodeKeyDown);

  this.el.nodes
    .transition('update-nodes')
    .duration(this.DURATION)
    .attr('opacity', 1)
    .attr('transform', node => `translate(${node.x}, ${node.y})`)
    .end()
    .catch(() => {})
    .finally(() => {
      // Sort nodes so tab focus order follows X/Y position
      this.el.nodes.sort((a, b) => a.order - b.order);
    });

  this.el.nodes
    .select('rect')
    .attr('width', node =>
      node.size ? Math.log(node.size) * 6 : node.width - 5
    )
    .attr('height', node =>
      node.size ? Math.log(node.size) * 6 : node.height - 5
    )
    .attr('x', node =>
      node.size ? Math.log(node.size) * -3 : (node.width - 5) / -2
    )
    .attr('y', node =>
      node.size ? Math.log(node.size) * -3 : (node.height - 5) / -2
    )
    .attr('rx', node => (node.type === 'task' ? 0 : node.height / 2));

  this.el.nodes
    .select('.node__icon')
    .transition('node-icon-offset')
    .duration(150)
    .attr('width', node => node.iconSize)
    .attr('height', node => node.iconSize)
    .attr('x', node => node.iconOffset)
    .attr('y', node => node.iconSize / -2);
};

export default draw;
