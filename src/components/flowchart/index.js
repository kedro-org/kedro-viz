import React, { Component } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import 'd3-transition';
import { select, event } from 'd3-selection';
import { interpolate } from 'd3-interpolate';
import { zoom, zoomIdentity, zoomTransform } from 'd3-zoom';
import { updateChartSize, updateZoom } from '../../actions';
import { toggleNodeClicked, toggleNodeHovered } from '../../actions/nodes';
import { getNodeActive, getNodeSelected } from '../../selectors/nodes';
import { getChartSize, getChartZoom } from '../../selectors/layout';
import { getLayers } from '../../selectors/layers';
import { getCentralNode, getLinkedNodes } from '../../selectors/linked-nodes';
import { drawNodes, drawEdges, drawLayers, drawLayerNames } from './draw';
import Tooltip from '../tooltip';
import './styles/flowchart.css';

/**
 * Display a pipeline flowchart, mostly rendered with D3
 */
export class FlowChart extends Component {
  constructor(props) {
    super(props);

    this.state = {
      tooltip: { visible: false }
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
    this.addGlobalEventListeners();
    this.update();

    if (this.props.tooltip) {
      this.showTooltip(null, this.props.tooltip);
    } else {
      this.hideTooltip();
    }
  }

  componentWillUnmount() {
    this.removeGlobalEventListeners();
  }

  componentDidUpdate(prevProps) {
    this.update(prevProps);
  }

  /**
   * Updates drawing and zoom if props have changed
   */
  update(prevProps = {}) {
    const { chartZoom } = this.props;
    const changed = (...names) => this.changed(names, prevProps, this.props);

    if (changed('visibleSidebar')) {
      this.updateChartSize();
    }

    if (changed('layers', 'chartSize')) {
      drawLayers.call(this);
      drawLayerNames.call(this);
    }

    if (changed('edges', 'centralNode', 'linkedNodes')) {
      drawEdges.call(this, changed);
    }

    if (
      changed(
        'nodes',
        'centralNode',
        'linkedNodes',
        'nodeActive',
        'nodeSelected'
      )
    ) {
      drawNodes.call(this, changed);
    }

    if (changed('edges', 'nodes', 'layers', 'chartSize')) {
      this.zoomToFit();
    } else {
      this.updateZoom(chartZoom);
    }
  }

  /**
   * Returns true if any of the given props are different between given objects.
   * Only shallow changes are detected.
   */
  changed(props, objectA, objectB) {
    return (
      objectA && objectB && props.some(prop => objectA[prop] !== objectB[prop])
    );
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
   * Add window event listeners on mount
   */
  addGlobalEventListeners() {
    // Add ResizeObserver to listen for any changes in the container's width/height
    // (with event listener fallback)
    if (window.ResizeObserver) {
      this.resizeObserver =
        this.resizeObserver ||
        new window.ResizeObserver(this.handleWindowResize);
      this.resizeObserver.observe(this.containerRef.current);
    } else {
      window.addEventListener('resize', this.handleWindowResize);
    }
    // Print event listeners
    window.addEventListener('beforeprint', this.handleBeforePrint);
    window.addEventListener('afterprint', this.handleAfterPrint);
  }

  /**
   * Remove window event listeners on unmount
   */
  removeGlobalEventListeners() {
    // ResizeObserver
    if (window.ResizeObserver) {
      this.resizeObserver.unobserve(this.containerRef.current);
    } else {
      window.removeEventListener('resize', this.handleWindowResize);
    }
    // Print event listeners
    window.removeEventListener('beforeprint', this.handleBeforePrint);
    window.removeEventListener('afterprint', this.handleAfterPrint);
  }

  /**
   * Handle window resize
   */
  handleWindowResize = () => {
    this.updateChartSize();
  };

  /**
   * Add viewBox on window print so that the SVG can be scaled to fit
   */
  handleBeforePrint = () => {
    const gs = this.props.graphSize;
    const width = gs.width + gs.marginx * 2;
    const height = gs.height + gs.marginy * 2;
    this.el.svg.attr('viewBox', `0 0 ${width} ${height}`);
  };

  /**
   * Remove viewBox once printing is done
   */
  handleAfterPrint = () => {
    this.el.svg.attr('viewBox', null);
  };

  /**
   * Setup D3 zoom behaviour on component mount
   */
  initZoomBehaviour() {
    this.zoomBehaviour = zoom()
      // Transition using linear interpolation
      .interpolate(interpolate)
      // When zoom changes
      .on('zoom', () => {
        const { k: scale, x, y } = event.transform;
        const [
          minScale = 0,
          maxScale = Infinity
        ] = this.zoomBehaviour.scaleExtent();
        const { sidebarWidth, metaSidebarWidth } = this.props.chartSize;
        const { width = 0, height = 0 } = this.props.graphSize;

        // Limit zoom translate extent: This needs to be recalculated on zoom
        // as it needs access to the current scale to correctly multiply the
        // sidebarWidth by the scale to offset it properly
        const margin = 500;
        this.zoomBehaviour.translateExtent([
          [-sidebarWidth / scale - margin, -margin],
          [width + margin + metaSidebarWidth / scale, height + margin]
        ]);

        // Transform the <g> that wraps the chart
        this.el.wrapper.attr('transform', event.transform);

        // Apply animating class to zoom wrapper
        this.el.wrapper.classed(
          'pipeline-flowchart__zoom-wrapper--animating',
          true
        );

        // Update layer label y positions
        if (this.el.layerNames) {
          this.el.layerNames.style('transform', d => {
            const ty = y + (d.y + d.height / 2) * scale;
            return `translateY(${ty}px)`;
          });
        }

        // Hide the tooltip so it doesn't get misaligned to its node
        this.hideTooltip();

        // Share the applied zoom state with other components
        this.props.onUpdateZoom({
          scale,
          x,
          y,
          applied: true,
          transition: false,
          minScale,
          maxScale
        });
      })
      // When zoom ends
      .on('end', () => {
        this.el.wrapper.classed(
          'pipeline-flowchart__zoom-wrapper--animating',
          false
        );
      });

    this.el.svg
      .call(this.zoomBehaviour)
      // Disabled to avoid conflicts with metadata panel triggered zooms
      .on('dblclick.zoom', null);
  }

  /**
   * Applies the given zoom state if necessary
   * @param {Object} chartZoom The new zoom state
   */
  updateZoom(chartZoom) {
    // No change if already applied (i.e. ignores internal updates)
    if (chartZoom.applied) {
      return;
    }

    // If the update is a reset, then just zoom to fit the graph
    if (chartZoom.reset === true) {
      this.zoomToFit();
      return;
    }

    // Get current zoom transform
    const zoom = this.zoomBehaviour;
    const currentTransform = zoomTransform(this.wrapperRef.current);
    const { k = 1 } = currentTransform;

    // Get the updated zoom components
    const { scale: targetScale = k, x: targetX, y: targetY } = chartZoom;
    const transition =
      chartZoom.transition || typeof chartZoom.transition === 'undefined';
    const hasTranslation =
      typeof targetX !== 'undefined' && typeof targetY !== 'undefined';

    // Apply the zoom update immediately at first
    // Note: only translateTo and scaleTo respect zoom extents
    // Note: requires three separate calls so can't transition this
    if (hasTranslation) {
      // Update position and scale
      this.el.svg
        .call(zoom.transform, zoomIdentity)
        .call(zoom.translateTo, targetX, targetY)
        .call(zoom.scaleTo, targetScale);
    } else {
      // Update scale only
      this.el.svg.call(zoom.scaleTo, targetScale);
    }

    // If the update requires a transition
    if (transition) {
      // Store the already computed target transform
      const targetTransform = zoomTransform(this.wrapperRef.current);

      // Revert and transition to target in a single call
      this.el.svg
        .call(zoom.transform, currentTransform)
        .transition('zoom')
        .duration(200)
        .call(zoom.transform, targetTransform);
    }
  }

  /**
   * Zoom and scale to fit graph exactly in the viewport
   */
  zoomToFit() {
    const { chartSize, graphSize } = this.props;

    let scale = 1;
    let translateX = 0;
    let translateY = 0;

    // Fit the graph exactly in the viewport
    if (chartSize.width > 0 && graphSize.width > 0) {
      scale = Math.min(
        chartSize.width / graphSize.width,
        chartSize.height / graphSize.height
      );

      translateX =
        (chartSize.width - graphSize.width * scale) / 2 +
        chartSize.sidebarWidth;
      translateY = (chartSize.height - graphSize.height * scale) / 2;
    }

    // Limit zoom scale extent
    this.zoomBehaviour.scaleExtent([scale * 0.8, 2]);

    // Get the target zoom transform
    const targetTransform = zoomIdentity
      .translate(translateX, translateY)
      .scale(scale);

    // Get the current zoom transform
    const { k = 1, x = 0, y = 0 } = zoomTransform(this.wrapperRef.current);
    const isFirstZoom = k === 1 && x === 0 && y === 0;

    // Avoid errors during tests due to lack of SVG support
    if (typeof jest !== 'undefined') {
      return;
    }

    // Apply transform but only transition after first zoom
    (isFirstZoom
      ? this.el.svg
      : this.el.svg.transition('zoom').duration(this.DURATION)
    ).call(this.zoomBehaviour.transform, targetTransform);
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
   * @param {?Object} options Options for the tooltip if required
   */
  showTooltip(node, options = {}) {
    this.setState({
      tooltip: {
        targetRect: event && event.target.getBoundingClientRect(),
        text: node && node.fullName,
        visible: true,
        ...options
      }
    });
  }

  /**
   * Hide the tooltip
   */
  hideTooltip() {
    if (this.state.tooltip.visible) {
      this.setState({
        tooltip: {
          ...this.state.tooltip,
          visible: false
        }
      });
    }
  }

  /**
   * Render React elements
   */
  render() {
    const { chartSize, layers } = this.props;
    const { outerWidth = 0, outerHeight = 0 } = chartSize;

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
          <g id="zoom-wrapper" ref={this.wrapperRef}>
            <defs>
              <marker
                id="pipeline-arrowhead"
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
          className={classnames('pipeline-flowchart__layer-names', {
            'pipeline-flowchart__layer-names--visible': layers.length
          })}
          ref={this.layerNamesRef}
        />
        <Tooltip chartSize={chartSize} {...this.state.tooltip} />
      </div>
    );
  }
}

// Maintain a single reference to support change detection
const emptyEdges = [];
const emptyNodes = [];
const emptyGraphSize = {};

export const mapStateToProps = (state, ownProps) => ({
  centralNode: getCentralNode(state),
  chartSize: getChartSize(state),
  chartZoom: getChartZoom(state),
  edges: state.graph.edges || emptyEdges,
  graphSize: state.graph.size || emptyGraphSize,
  layers: getLayers(state),
  linkedNodes: getLinkedNodes(state),
  nodes: state.graph.nodes || emptyNodes,
  nodeActive: getNodeActive(state),
  nodeSelected: getNodeSelected(state),
  visibleSidebar: state.visible.sidebar,
  ...ownProps
});

export const mapDispatchToProps = (dispatch, ownProps) => ({
  onToggleNodeClicked: nodeClicked => {
    dispatch(toggleNodeClicked(nodeClicked));
  },
  onToggleNodeHovered: nodeHovered => {
    dispatch(toggleNodeHovered(nodeHovered));
  },
  onUpdateChartSize: chartSize => {
    dispatch(updateChartSize(chartSize));
  },
  onUpdateZoom: transform => {
    dispatch(updateZoom(transform));
  },
  ...ownProps
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FlowChart);
