import React, { Component } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import 'd3-transition';
import { select, event } from 'd3-selection';
import { zoom, zoomIdentity } from 'd3-zoom';
import { updateChartSize } from '../../actions';
import { toggleNodeClicked, toggleNodeHovered } from '../../actions/nodes';
import {
  getChartSize,
  getGraphSize,
  getLayoutNodes,
  getLayoutEdges,
  getZoomPosition
} from '../../selectors/layout';
import { getLayers } from '../../selectors/layers';
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
    this.layersRef = React.createRef();
    this.layerNamesRef = React.createRef();
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
    if (prevProps.visibleSidebar !== this.props.visibleSidebar) {
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
      nodeGroup: select(this.nodesRef.current),
      layerGroup: select(this.layersRef.current),
      layerNameGroup: select(this.layerNamesRef.current)
    };
  }

  /**
   * Configure globals for the container dimensions,
   * and apply them to the chart SVG
   */
  updateChartSize() {
    this.props.onUpdateChartSize(
      this.containerRef.current.getBoundingClientRect()
    );
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
      const { k: scale, y } = event.transform;
      const { sidebarWidth } = this.props.chartSize;
      const { width, height } = this.props.graphSize;

      // Limit zoom translate extent: This needs to be recalculated on zoom
      // as it needs access to the current scale to correctly multiply the
      // sidebarWidth by the scale to offset it properly
      const margin = 200;
      this.zoomBehaviour.translateExtent([
        [-sidebarWidth / scale - margin, -margin],
        [width + margin, height + margin]
      ]);

      // Transform the <g> that wraps the chart
      this.el.wrapper.attr('transform', event.transform);

      // Update layer label y positions
      this.el.layerNames
        .style('height', d => `${d.height * scale}px`)
        .style('transform', d => {
          const ty = y + d.y * scale;
          return `translateY(${ty}px)`;
        });

      // Hide the tooltip so it doesn't get misaligned to its node
      this.hideTooltip();
    });
    this.el.svg.call(this.zoomBehaviour);
  }

  /**
   * Zoom and scale to fit
   */
  zoomChart() {
    const { scale = 1, translateX = 0, translateY = 0 } = this.props.zoom;

    // Limit zoom scale extent
    this.zoomBehaviour.scaleExtent([scale * 0.8, 1]);

    // Auto zoom to fit the chart nicely on the page
    this.el.svg
      .transition()
      .duration(this.DURATION)
      .call(
        this.zoomBehaviour.transform,
        zoomIdentity.translate(translateX, translateY).scale(scale)
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
    const { left, top, width, outerWidth, sidebarWidth } = this.props.chartSize;
    const eventOffset = event.target.getBoundingClientRect();
    const isRight = eventOffset.left - sidebarWidth > width / 2;
    const xOffset = isRight ? eventOffset.left - outerWidth : eventOffset.left;
    this.setState({
      tooltipVisible: true,
      tooltipIsRight: isRight,
      tooltipText: node.fullName,
      tooltipX: xOffset - left + eventOffset.width / 2,
      tooltipY: eventOffset.top - top
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
    const { outerWidth = 0, outerHeight = 0 } = this.props.chartSize;
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
            <g className="pipeline-flowchart__layers" ref={this.layersRef} />
            <g className="pipeline-flowchart__edges" ref={this.edgesRef} />
            <g
              id="nodes"
              className="pipeline-flowchart__nodes"
              ref={this.nodesRef}
            />
          </g>
        </svg>
        <ul
          className="pipeline-flowchart__layer-names"
          ref={this.layerNamesRef}
        />
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
  chartSize: getChartSize(state),
  edges: getLayoutEdges(state),
  graphSize: getGraphSize(state),
  layers: getLayers(state),
  linkedNodes: getLinkedNodes(state),
  nodes: getLayoutNodes(state),
  textLabels: state.textLabels,
  visibleLayers: state.visible.layers,
  visibleSidebar: state.visible.sidebar,
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
