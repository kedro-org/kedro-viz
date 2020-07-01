import 'd3-transition';

const viewportMargin = 1;

/**
 * Render viewport region
 */
export const drawViewport = function() {
  const { chartZoom, chartSize, mapSize } = this.props;

  const mapZoom = this.getZoomPosition();
  const scale = mapZoom.scale / chartZoom.scale;
  const width = (chartSize.width + chartSize.sidebarWidth) * scale;
  const height = chartSize.height * scale;
  const x = mapZoom.translateX - chartZoom.x * scale;
  const y = mapZoom.translateY - chartZoom.y * scale;

  const minX = Math.max(x, viewportMargin);
  const minY = Math.max(y, viewportMargin);
  const maxX = Math.min(x + width, mapSize.width - viewportMargin);
  const maxY = Math.min(y + height, mapSize.height - viewportMargin);

  this.el.viewport
    .enter()
    .attr('x', 0)
    .attr('y', 0);

  this.el.viewport
    .attr('transform', `translate(${minX}, ${minY})`)
    .attr('width', Math.max(0, maxX - minX))
    .attr('height', Math.max(0, maxY - minY));
};

/**
 * Render nodes
 */
export const drawNodes = function() {
  const {
    centralNode,
    linkedNodes,
    nodeActive,
    nodeSelected,
    nodes
  } = this.props;

  this.el.nodeGroup.enter().attr('opacity', 0);

  this.el.nodeGroup
    .transition()
    .duration(this.DURATION)
    .attr('opacity', 1);

  this.el.nodes = this.el.nodeGroup
    .selectAll('.pipeline-minimap-node')
    .data(nodes, node => node.id);

  const enterNodes = this.el.nodes
    .enter()
    .append('g')
    .attr('class', 'pipeline-minimap-node');

  enterNodes.attr('transform', node => `translate(${node.x}, ${node.y})`);

  enterNodes.append('rect');

  this.el.nodes = this.el.nodes
    .merge(enterNodes)
    .attr('data-id', node => node.id)
    .classed('pipeline-minimap-node--active', node => nodeActive[node.id])
    .classed('pipeline-minimap-node--selected', node => nodeSelected[node.id])
    .classed(
      'pipeline-minimap-node--faded',
      node => centralNode && !linkedNodes[node.id]
    );

  this.el.nodes
    .transition('update-nodes')
    .duration(this.DURATION)
    .attr('transform', node => `translate(${node.x}, ${node.y})`)
    .end()
    .catch(() => {});

  this.el.nodes
    .select('rect')
    .attr('width', node => node.width - sizeOffset(node))
    .attr('height', node => node.height - sizeOffset(node))
    .attr('x', node => (node.width - sizeOffset(node)) / -2)
    .attr('y', node => (node.height - sizeOffset(node)) / -2);
};

const sizeOffset = node => (node.type === 'task' ? 5 : 16);
