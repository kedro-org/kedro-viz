import React, { Component } from 'react';
import { connect } from 'react-redux';
import 'd3-transition';
import { select, event } from 'd3-selection';
import { curveBasis, line } from 'd3-shape';
import { zoom, zoomIdentity } from 'd3-zoom';
import { toggleNodeActive } from '../../actions';
import { getGraph, getLayout } from '../../selectors/layout';
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

  componentDidUpdate() {
    this.updateChartSize();
    this.drawChart();
    this.zoomChart(true);
  }

  /**
   * Configure globals for the container dimensions,
   * and apply them to the chart SVG
   */
  setChartHeight() {
    const { left, top, width, height } = this._container.getBoundingClientRect();
    this.x = left;
    this.y = top;
    this.width = width - this.getNavOffset(width);
    this.height = height;
    this.el.svg.attr('width', width).attr('height', height);
  }

  getNavOffset(width = this.width) {
    const navWidth = width > 480 ? 400 : 0;
    return this.navOffset = this.props.visibleNav ? navWidth : 0;
  }

  /**
   * Handle window resize
   */
  handleWindowResize() {
    this.updateChartSize();
    this.drawChart();
    this.zoomChart(true);
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
   * @param {Boolean} isUpdate - Whether chart is updating and should be animated
   */
  zoomChart(isUpdate) {
    const { width, height } = this.props.graph.graph();
    const zoomScale = Math.min(this.width / width, this.height / height);
    const translateX = this.width / 2 - width * zoomScale / 2;
    const translateY = this.height / 2 - height * zoomScale / 2;
    if (isNaN(translateX) || isNaN(translateY)) {
      return;
    }
    const { svg } = this.el;
    const svgZoom = isUpdate ? svg.transition().duration(DURATION) : svg;
    svgZoom.call(
      this.zoomBehaviour.transform,
      zoomIdentity.translate(translateX, translateY).scale(zoomScale)
    );
  }

  /**
   * Render chart to the DOM with D3
   */
  drawChart() {
    const { onToggleNodeActive, textLabels } = this.props;
    const { nodes, edges } = this.props.layout;

    // Transition the wrapper
    this.el.wrapper
      .transition('wrapper-navoffset')
      .duration(DURATION)
      .attr('transform', d => `translate(${this.navOffset}, 0)`);

    // Create selections
    this.el.edges = this.el.edgeGroup
      .selectAll('.edge')
      .data(edges, d => d.id);

    this.el.nodes = this.el.nodeGroup
      .selectAll('.node')
      .data(nodes, d => d.id);

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
      .attr('d', d => d.points && lineShape(d.points));

    // Create nodes
    const enterNodes = this.el.nodes
      .enter()
      .append('g')
      .attr('class', 'node');

    enterNodes
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .attr('opacity', 0);

    enterNodes.append('circle').attr('r', 25);

    enterNodes.append('rect');

    enterNodes
      .append(d => d.type === 'data' ? databaseIcon(d) : cogIcon(d))

    enterNodes
      .append('text')
      .text(d => d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', 4);

    this.el.nodes
      .exit()
      .transition('exit-nodes')
      .duration(DURATION)
      .attr('opacity', 0)
      .remove();

    this.el.nodes = this.el.nodes
      .merge(enterNodes)
      .classed('node--data', d => d.type === 'data')
      .classed('node--task', d => d.type === 'task')
      .classed('node--icon', !textLabels)
      .classed('node--text', textLabels)
      .classed('node--active', d => d.active)
      .on('mouseover', d => {
        onToggleNodeActive(d, true);
        tooltip.show(this, d);
        linkedNodes.show(this.props.layout.edges, this.el, d.id);
      })
      .on('mousemove', d => {
        tooltip.show(this, d);
      })
      .on('mouseout', d => {
        onToggleNodeActive(d, false);
        linkedNodes.hide(this.el);
        tooltip.hide(this.el);
      });

    this.el.nodes
      .transition('update-nodes')
      .duration(DURATION)
      .attr('opacity', 1)
      .attr('transform', d => `translate(${d.x}, ${d.y})`);

    this.el.nodes
      .select('rect')
      .attr('width', d => d.width - 5)
      .attr('height', d => d.height - 5)
      .attr('x', d => (d.width - 5) / -2)
      .attr('y', d => (d.height - 5) / -2)
      .attr('rx', d => (d.type === 'data' ? d.height / 2 : 0));
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

const mapStateToProps = state => ({
  activeSnapshot: state.activeSnapshot,
  graph: getGraph(state),
  layout: getLayout(state),
  textLabels: state.textLabels,
  view: state.view
});

const mapDispatchToProps = dispatch => ({
  onToggleNodeActive: (node, isActive) => {
    dispatch(toggleNodeActive(node.id, isActive));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(FlowChart);
