import React, { Component } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import 'd3-transition';
import { interpolatePath } from 'd3-interpolate-path';
import { select, event } from 'd3-selection';
import { curveBasis, line } from 'd3-shape';
import { zoom, zoomIdentity } from 'd3-zoom';
import { toggleNodeActive, updateChartSize } from '../../actions';
import { getLayout, getZoomPosition } from '../../selectors/layout';
import linkedNodes from './linked-nodes';
import icon from './icon';
import './flowchart.css';

const DURATION = 700;

/**
 * Display a flowchart for the current snapshot, mostly rendered with D3
 */
export class FlowChart extends Component {
  constructor(props) {
    super(props);

    this.state = {
      tooltipVisible: false,
      tooltipIsRight: false,
      tooltipText: null,
      tooltipX: 0,
      tooltipY: 0
    };

    this.containerRef = React.createRef();
    this.svgRef = React.createRef();
    this.wrapperRef = React.createRef();
    this.edgesRef = React.createRef();
    this.nodesRef = React.createRef();

    this.handleWindowResize = this.handleWindowResize.bind(this);
    this.handleNodeMouseOver = this.handleNodeMouseOver.bind(this);
    this.handleNodeMouseOut = this.handleNodeMouseOut.bind(this);
  }

  componentDidMount() {
    // Create D3 element selectors
    this.el = {
      svg: select(this.svgRef.current),
      wrapper: select(this.wrapperRef.current),
      edgeGroup: select(this.edgesRef.current),
      nodeGroup: select(this.nodesRef.current)
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
    const {
      left,
      top,
      width,
      height
    } = this.containerRef.current.getBoundingClientRect();
    const navOffset = this.getNavOffset(width);
    this.props.onUpdateChartSize({
      x: left,
      y: top,
      outerWidth: width,
      outerHeight: height,
      width: width - navOffset,
      height,
      navOffset
    });
  }

  getNavOffset(width) {
    const navWidth = 300; // from _variables.scss
    const breakpointSmall = 480; // from _variables.scss
    if (this.props.visibleNav && width > breakpointSmall) {
      return navWidth;
    }
    return 0;
  }

  /**
   * Handle window resize
   */
  handleWindowResize() {
    this.updateChartSize();
  }

  /**
   * Setup D3 zoom behaviour on component mount
   */
  initZoomBehaviour() {
    this.zoomBehaviour = zoom().on('zoom', () => {
      this.el.wrapper.attr('transform', event.transform);
      this.hideTooltip();
    });
    this.el.svg.call(this.zoomBehaviour);
  }

  /**
   * Zoom and scale to fit
   */
  zoomChart() {
    const { chartSize, zoom } = this.props;
    const { scale, translateX, translateY } = zoom;
    const navOffset = this.getNavOffset(chartSize.outerWidth);
    this.el.svg
      .transition()
      .duration(DURATION)
      .call(
        this.zoomBehaviour.transform,
        zoomIdentity.translate(translateX + navOffset, translateY).scale(scale)
      );
  }

  /**
   * Render chart to the DOM with D3
   */
  drawChart() {
    const { layout, textLabels } = this.props;
    const { nodes, edges } = layout;

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
      .attrTween('d', function(edge) {
        const current = edge.points && lineShape(edge.points);
        const previous = select(this).attr('d') || current;
        return interpolatePath(previous, current);
      });

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

    enterNodes.append(icon);

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

    this.el.nodes = this.el.nodes
      .merge(enterNodes)
      .classed('node--data', node => node.type === 'data')
      .classed('node--task', node => node.type === 'task')
      .classed('node--icon', !textLabels)
      .classed('node--text', textLabels)
      .classed('node--active', node => node.active)
      .on('mouseover', this.handleNodeMouseOver)
      .on('mouseout', this.handleNodeMouseOut);

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
   * Event handler for toggling a node's active state,
   * showing tooltip, and highlighting linked nodes
   * @param {Object} node Datum for a single node
   */
  handleNodeMouseOver(node) {
    const { layout, onToggleNodeActive } = this.props;
    onToggleNodeActive(node, true);
    this.showTooltip(node);
    linkedNodes.show({
      el: this.el,
      nodeID: node.id,
      ...layout
    });
  }

  /**
   * Event handler for toggling a node's active state,
   * hiding tooltip, and dimming linked nodes
   * @param {Object} node Datum for a single node
   */
  handleNodeMouseOut(node) {
    this.props.onToggleNodeActive(node, false);
    linkedNodes.hide(this.el);
    this.hideTooltip();
  }

  /**
   * Show, fill and and position the tooltip
   * @param {Object} node A node datum
   */
  showTooltip(node) {
    const { chartSize } = this.props;
    const eventOffset = event.target.getBoundingClientRect();
    const navOffset = this.getNavOffset(chartSize.outerWidth);
    const isRight = eventOffset.left - navOffset > chartSize.width / 2;
    const xOffset = isRight
      ? eventOffset.left - (chartSize.width + navOffset)
      : eventOffset.left;
    this.setState({
      tooltipVisible: true,
      tooltipIsRight: isRight,
      tooltipText: node.name,
      tooltipX: xOffset - chartSize.x + eventOffset.width / 2,
      tooltipY: eventOffset.top - chartSize.y
    });
  }

  /**
   * Hide the tooltip
   */
  hideTooltip() {
    if (this.state.tooltipVisible) {
      this.setState({
        tooltipVisible: false
      });
    }
  }

  /**
   * Render React elements
   */
  render() {
    const { outerWidth, outerHeight } = this.props.chartSize;
    const {
      tooltipVisible,
      tooltipIsRight,
      tooltipText,
      tooltipX,
      tooltipY
    } = this.state;

    return (
      <div className="pipeline-flowchart kedro" ref={this.containerRef}>
        <svg
          className="pipeline-flowchart__graph"
          width={outerWidth}
          height={outerHeight}
          ref={this.svgRef}>
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
          <g ref={this.wrapperRef}>
            <g className="pipeline-flowchart__edges" ref={this.edgesRef} />
            <g
              id="nodes"
              className="pipeline-flowchart__nodes"
              ref={this.nodesRef}
            />
          </g>
        </svg>
        <div
          className={classnames('pipeline-flowchart__tooltip kedro', {
            'tooltip--visible': tooltipVisible,
            'tooltip--right': tooltipIsRight
          })}
          style={{ transform: `translate(${tooltipX}px, ${tooltipY}px)` }}>
          <span>{tooltipText}</span>
        </div>
      </div>
    );
  }
}

export const mapStateToProps = state => ({
  activeSnapshot: state.activeSnapshot,
  chartSize: state.chartSize,
  layout: getLayout(state),
  textLabels: state.textLabels,
  view: state.view,
  zoom: getZoomPosition(state)
});

export const mapDispatchToProps = dispatch => ({
  onToggleNodeActive: (node, isActive) => {
    dispatch(toggleNodeActive(node.id, isActive));
  },
  onUpdateChartSize: chartSize => {
    dispatch(updateChartSize(chartSize));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FlowChart);
