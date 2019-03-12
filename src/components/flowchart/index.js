import React, { Component } from 'react';
import { connect } from 'react-redux';
import 'd3-transition';
import { select, event } from 'd3-selection';
import { curveBasis, line } from 'd3-shape';
import { zoom, zoomIdentity } from 'd3-zoom';
import { toggleNodeActive, updateChartSize } from '../../actions';
import { getGraph, getLayout, getZoomPosition } from '../../selectors/layout';
import linkedNodes from './linked-nodes';
import tooltip from './tooltip';
import databaseIcon from './database-icon';
import cogIcon from './cog-icon';
import './flowchart.css';

const DURATION = 700;

/**
 * Display a flowchart for the current snapshot, mostly rendered with D3
 */
class FlowChart extends Component {
  constructor(props) {
    super(props);
    this.handleWindowResize = this.handleWindowResize.bind(this);
  }

  componentDidMount() {
    // Select d3 elements
    this.el = {
      svg: select(this._svg),
      inner: select(this._gInner),
      wrapper: select(this._gWrapper),
      edgeGroup: select(this._gEdges),
      nodeGroup: select(this._gNodes),
      tooltip: select(this._tooltip)
    };

    this.updateChartSize();
    this.initZoomBehaviour();
    this.drawChart();
    this.zoomChart();
    window.addEventListener('resize', this.handleWindowResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.visibleNav !== this.props.visibleNav) {
      this.updateChartSize();
    }
    if (prevProps.zoom !== this.props.zoom) {
      this.zoomChart();
    }
    this.drawChart();
  }

  /**
   * Configure globals for the container dimensions,
   * and apply them to the chart SVG
   */
  updateChartSize() {
    const { left, top, width, height } = this._container.getBoundingClientRect();
    const chartSize = {
      x: left,
      y: top,
      width: width - this.getNavOffset(width),
      height,
    };
    this.props.onUpdateChartSize(chartSize);
    this.el.svg.attr('width', width).attr('height', height);
  }

  getNavOffset(width) {
    const navWidth = width > 480 ? 300 : 0;
    return this.props.visibleNav ? navWidth : 0;
  }

  /**
   * Handle window resize
   */
  handleWindowResize() {
    this.updateChartSize();
    this.drawChart();
    this.zoomChart();
  }

  /**
   * Setup D3 zoom behaviour on component mount
   */
  initZoomBehaviour() {
    this.zoomBehaviour = zoom().on('zoom', () => {
      tooltip.hide(this.el);
      this.el.inner.attr('transform', event.transform);
    });
    this.el.svg.call(this.zoomBehaviour);
  }

  /**
   * Zoom and scale to fit
   */
  zoomChart() {
    const { scale, translateX, translateY } = this.props.zoom;
    this.el.svg
      .transition()
      .duration(DURATION)
      .call(
        this.zoomBehaviour.transform,
        zoomIdentity.translate(translateX, translateY).scale(scale)
      );
  }

  /**
   * Render chart to the DOM with D3
   */
  drawChart() {
    const { chartSize, layout, onToggleNodeActive, textLabels } = this.props;
    const { nodes, edges } = layout;
    const navOffset = this.getNavOffset(chartSize.width);

    // Animate the wrapper translation when nav is toggled
    this.el.wrapper
      .transition('wrapper-navoffset')
      .duration(DURATION)
      .attr('transform', () => `translate(${navOffset}, 0)`);

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

    enterEdges.append('path').attr('marker-end', d => `url(#arrowhead)`);

    this.el.edges
      .exit()
      .transition('exit-edges')
      .duration(DURATION)
      .attr('opacity', 0)
      .remove();

    this.el.edges = this.el.edges.merge(enterEdges);

    this.el.edges
      .transition('show-edges')
      .duration(DURATION)
      .attr('opacity', 1);

    this.el.edges
      .select('path')
      .transition('update-edges')
      .duration(DURATION)
      .attr('d', edge => edge.points && lineShape(edge.points));

    // Create nodes
    const enterNodes = this.el.nodes
      .enter()
      .append('g')
      .attr('class', 'node');

    enterNodes
      .attr('transform', node => `translate(${node.x}, ${node.y})`)
      .attr('opacity', 0);

    enterNodes.append('circle').attr('r', 25);

    enterNodes.append('rect');

    enterNodes
      .append(node => node.type === 'data' ? databaseIcon(node) : cogIcon(node))

    enterNodes
      .append('text')
      .text(node => node.name)
      .attr('text-anchor', 'middle')
      .attr('dy', 4);

    this.el.nodes
      .exit()
      .transition('exit-nodes')
      .duration(DURATION)
      .attr('opacity', 0)
      .remove();

    const tooltipProps = {
      ...chartSize,
      navOffset,
      tooltip: this.el.tooltip,
    };

    const linkedNodeProps = {
      el: this.el,
      edges,
      nodes,
    };

    this.el.nodes = this.el.nodes
      .merge(enterNodes)
      .classed('node--data', node => node.type === 'data')
      .classed('node--task', node => node.type === 'task')
      .classed('node--icon', !textLabels)
      .classed('node--text', textLabels)
      .classed('node--active', node => node.active)
      .on('mouseover', node => {
        onToggleNodeActive(node, true);
        tooltip.show(tooltipProps, node);
        linkedNodes.show(linkedNodeProps, node.id);
      })
      .on('mousemove', node => {
        tooltip.show(tooltipProps, node);
      })
      .on('mouseout', node => {
        onToggleNodeActive(node, false);
        linkedNodes.hide(this.el);
        tooltip.hide(this.el);
      });

    this.el.nodes
      .transition('update-nodes')
      .duration(DURATION)
      .attr('opacity', 1)
      .attr('transform', node => `translate(${node.x}, ${node.y})`);

    this.el.nodes
      .select('rect')
      .attr('width', node => node.width - 5)
      .attr('height', node => node.height - 5)
      .attr('x', node => (node.width - 5) / -2)
      .attr('y', node => (node.height - 5) / -2)
      .attr('rx', node => (node.type === 'data' ? node.height / 2 : 0));
  }

  /**
   * Render React elements
   */
  render() {
    return (
      <div className="pipeline-flowchart carbon" ref={el => (this._container = el)}>
        <svg className="pipeline-flowchart__graph" ref={el => (this._svg = el)}>
          <defs>
            <marker
              id="arrowhead"
              className="pipeline-flowchart__arrowhead"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerUnits="strokeWidth"
              markerWidth="8"
              markerHeight="6"
              orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 L 4 5 z" />
            </marker>
          </defs>
          <g ref={el => (this._gWrapper = el)}>
            <g ref={el => (this._gInner = el)}>
              <g className="pipeline-flowchart__edges" ref={el => (this._gEdges = el)} />
              <g
                id="nodes"
                className="pipeline-flowchart__nodes"
                ref={el => (this._gNodes = el)} />
            </g>
          </g>
        </svg>
        <div className="pipeline-flowchart__tooltip carbon" ref={el => (this._tooltip = el)} />
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  activeSnapshot: state.activeSnapshot,
  chartSize: state.chartSize,
  graph: getGraph(state),
  layout: getLayout(state),
  textLabels: state.textLabels,
  view: state.view,
  zoom: getZoomPosition(state)
});

const mapDispatchToProps = dispatch => ({
  onToggleNodeActive: (node, isActive) => {
    dispatch(toggleNodeActive(node.id, isActive));
  },
  onUpdateChartSize: (chartSize) => {
    dispatch(updateChartSize(chartSize));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(FlowChart);
