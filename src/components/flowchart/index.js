import React, { Component } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import 'd3-transition';
import { select, event } from 'd3-selection';
import { zoom, zoomIdentity } from 'd3-zoom';
import { updateChartSize } from '../../actions';
import { toggleNodeClicked, toggleNodeHovered } from '../../actions/nodes';
import {
  getLayoutNodes,
  getLayoutEdges,
  getZoomPosition
} from '../../selectors/layout';
import { getCentralNode, getLinkedNodes } from '../../selectors/linked-nodes';
import draw from './draw';
import './styles/flowchart.css';

/**
 * Display a pipeline flowchart, mostly rendered with D3
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

    this.DURATION = 700;

    this.containerRef = React.createRef();
    this.svgRef = React.createRef();
    this.wrapperRef = React.createRef();
    this.edgesRef = React.createRef();
    this.nodesRef = React.createRef();
  }

  componentDidMount() {
    this.selectD3Elements();
    this.updateChartSize();
    this.initZoomBehaviour();
    this.drawChart();
    this.zoomChart();
    this.addResizeObserver();
  }

  componentWillUnmount() {
    this.removeResizeObserver();
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
   * Create D3 element selectors
   */
  selectD3Elements() {
    this.el = {
      svg: select(this.svgRef.current),
      wrapper: select(this.wrapperRef.current),
      edgeGroup: select(this.edgesRef.current),
      nodeGroup: select(this.nodesRef.current)
    };
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
   * Add ResizeObserver to listen for any changes in the container's width/height
   * (with event listener fallback)
   */
  addResizeObserver() {
    if (window.ResizeObserver) {
      this.resizeObserver =
        this.resizeObserver ||
        new window.ResizeObserver(this.handleWindowResize);
      this.resizeObserver.observe(this.containerRef.current);
    } else {
      window.addEventListener('resize', this.handleWindowResize);
    }
  }

  /**
   * Remove ResizeObserver (or event listener fallback) on unmount
   */
  removeResizeObserver() {
    if (window.ResizeObserver) {
      this.resizeObserver.unobserve(this.containerRef.current);
    } else {
      window.removeEventListener('resize', this.handleWindowResize);
    }
  }

  /**
   * Handle window resize
   */
  handleWindowResize = () => {
    this.updateChartSize();
  };

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
      .duration(this.DURATION)
      .call(
        this.zoomBehaviour.transform,
        zoomIdentity.translate(translateX + navOffset, translateY).scale(scale)
      );
  }

  /**
   * Render chart to the DOM with D3
   */
  drawChart() {
    draw.call(this);
  }

  /**
   * Enable a node's focus state and highlight linked nodes
   * @param {Object} node Datum for a single node
   */
  handleNodeClick = node => {
    this.props.onToggleNodeClicked(node.id);
    event.stopPropagation();
  };

  /**
   * Remove a node's focus state and dim linked nodes
   */
  handleChartClick = () => {
    this.props.onToggleNodeClicked(null);
  };

  /**
   * Enable a node's active state, show tooltip, and highlight linked nodes
   * @param {Object} node Datum for a single node
   */
  handleNodeMouseOver = node => {
    this.props.onToggleNodeHovered(node.id);
    this.showTooltip(node);
  };

  /**
   * Remove a node's active state, hide tooltip, and dim linked nodes
   * @param {Object} node Datum for a single node
   */
  handleNodeMouseOut = () => {
    this.props.onToggleNodeHovered(null);
    this.hideTooltip();
  };

  /**
   * Handle keydown event when a node is focused
   * @param {Object} node Datum for a single node
   */
  handleNodeKeyDown = node => {
    const ENTER = 13;
    const ESCAPE = 27;
    if (event.keyCode === ENTER) {
      this.handleNodeClick(node);
    }
    if (event.keyCode === ESCAPE) {
      this.handleChartClick();
      this.handleNodeMouseOut(node);
    }
  };

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
      tooltipText: node.fullName,
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
      <div
        className="pipeline-flowchart kedro"
        ref={this.containerRef}
        onClick={this.handleChartClick}>
        <svg
          id="pipeline-graph"
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
          <g id="zoom-wrapper" ref={this.wrapperRef}>
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
  centralNode: getCentralNode(state),
  chartSize: state.chartSize,
  edges: getLayoutEdges(state),
  linkedNodes: getLinkedNodes(state),
  nodes: getLayoutNodes(state),
  textLabels: state.textLabels,
  view: state.view,
  zoom: getZoomPosition(state)
});

export const mapDispatchToProps = dispatch => ({
  onToggleNodeClicked: nodeClicked => {
    dispatch(toggleNodeClicked(nodeClicked));
  },
  onToggleNodeHovered: nodeHovered => {
    dispatch(toggleNodeHovered(nodeHovered));
  },
  onUpdateChartSize: chartSize => {
    dispatch(updateChartSize(chartSize));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FlowChart);
