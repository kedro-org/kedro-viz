import 'd3-transition';

/**
 * Render viewport region
 */
const drawViewport = function() {
  const { chartZoom, chartSize, mapSize } = this.props;

  const mapZoom = this.getZoomPosition();
  const scale = mapZoom.scale / chartZoom.scale;
  const width = (chartSize.width + chartSize.sidebarWidth) * scale;
  const height = chartSize.height * scale;
  const x = mapZoom.translateX - chartZoom.x * scale;
  const y = mapZoom.translateY - chartZoom.y * scale;

  const minX = Math.max(x, 1);
  const minY = Math.max(y, 1);
  const maxX = Math.min(x + width, mapSize.width - 1);
  const maxY = Math.min(y + height, mapSize.height - 1);

  this.el.viewport
    .attr('x', minX)
    .attr('y', minY)
    .attr('width', maxX - minX)
    .attr('height', maxY - minY);
};

/**
 * Render nodes
 */
const drawNodes = function() {
  const {
    centralNode,
    linkedNodes,
    nodeActive,
    nodeSelected,
    nodes
  } = this.props;

  this.el.nodes = this.el.nodeGroup
    .selectAll('.pipeline-minimap-node')
    .data(nodes, node => node.id);

  const enterNodes = this.el.nodes
    .enter()
    .append('g')
    .attr('class', 'pipeline-minimap-node');

  enterNodes
    .attr('transform', node => `translate(${node.x}, ${node.y})`)
    .attr('opacity', 0);

  enterNodes.append('rect');

  this.el.nodes
    .exit()
    .transition('exit-nodes')
    .duration(this.DURATION)
    .attr('opacity', 0)
    .remove();

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
    .attr('opacity', 1)
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

const sizeOffset = node => (node.type === 'task' ? 0 : 15) - 5;

/**
 * Render chart to the DOM with D3
 */
const draw = function() {
  drawViewport.call(this);
  drawNodes.call(this);
};

export default draw;
