import React, { Component } from 'react';
import { connect } from 'react-redux';
import { select } from 'd3-selection';
import { updateChartSize, updateZoom } from '../../actions';
import {
  toggleSingleModularPipelineExpanded,
  toggleModularPipelineActive,
} from '../../actions/modular-pipelines';
import {
  loadNodeData,
  toggleNodeHovered,
  toggleNodeClicked,
} from '../../actions/nodes';
import {
  getNodeActive,
  getNodeSelected,
  getNodesWithInputParams,
  getInputOutputNodesForFocusedModularPipeline,
} from '../../selectors/nodes';
import { getInputOutputDataEdges } from '../../selectors/edges';
import { getChartSize, getChartZoom } from '../../selectors/layout';
import { getLayers } from '../../selectors/layers';
import { getLinkedNodes } from '../../selectors/linked-nodes';
import { getVisibleMetaSidebar } from '../../selectors/metadata';
import { getRunCommand } from '../../selectors/run-command';
import { getNodesStatus, getDatasetsStatus } from '../../selectors/status';
import {
  viewing,
  isOrigin,
  viewTransformToFit,
  setViewTransform,
  getViewTransform,
  setViewTransformExact,
  setViewExtents,
  getViewExtents,
} from '../../utils/view';
import Tooltip from '../ui/tooltip';
import {
  DrawNodes,
  DrawEdges,
  DrawLayerNamesGroup,
  DrawLayersGroup,
  GraphSVG,
} from '../draw';
import { DURATION, MARGIN, MIN_SCALE, MAX_SCALE } from '../draw/utils/config';

import './workflow.scss';

/**
 * Display a pipeline flowchart, mostly rendered with D3
 */
export class Workflow extends Component {
  constructor(props) {
    super(props);

    this.state = {
      tooltip: { visible: false },
      activeLayer: undefined,
    };
    this.onViewChange = this.onViewChange.bind(this);
    this.onViewChangeEnd = this.onViewChangeEnd.bind(this);

    this.containerRef = React.createRef();
    this.svgRef = React.createRef();
    this.wrapperRef = React.createRef();
    this.layersRef = React.createRef();
    this.layerNamesRef = React.createRef();
  }

  componentDidMount() {
    this.updateChartSize();

    this.view = viewing({
      container: this.svgRef,
      wrapper: this.wrapperRef,
      onViewChanged: this.onViewChange,
      onViewEnd: this.onViewChangeEnd,
    });

    this.updateViewExtents();
    this.addGlobalEventListeners();
    this.update();

    if (this.props.tooltip) {
      this.showTooltip(null, null, this.props.tooltip);
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
    const preventZoom = this.props.visibleMetaSidebar;

    if (changed('visibleSidebar', 'visibleCode', 'visibleMetaSidebar')) {
      this.updateChartSize();
    }

    if (changed('edges', 'nodes', 'layers', 'chartSize', 'clickedNode')) {
      // Don't zoom out when the metadata or code panels are opened or closed
      const metaSidebarViewChanged =
        prevProps.visibleMetaSidebar !== this.props.visibleMetaSidebar;

      const codeViewChangedWithoutMetaSidebar =
        prevProps.visibleCode !== this.props.visibleCode &&
        !this.props.visibleMetaSidebar;

      // Don't zoom out when the clicked node changes and the nodeReFocus is disabled
      const clickedNodeChangedWithoutReFocus =
        prevProps.clickedNode !== this.props.clickedNode &&
        !this.props.nodeReFocus;

      if (
        metaSidebarViewChanged ||
        codeViewChangedWithoutMetaSidebar ||
        clickedNodeChangedWithoutReFocus
      ) {
        return;
      }

      this.resetView(preventZoom);
    } else {
      this.onChartZoomChanged(chartZoom);
    }
  }

  /**
   * Returns true if any of the given props are different between given objects.
   * Only shallow changes are detected.
   */
  changed(props, objectA, objectB) {
    return (
      objectA &&
      objectB &&
      props.some((prop) => objectA[prop] !== objectB[prop])
    );
  }

  /**
   * Update the chart size in state from chart container bounds.
   * This is emulated in tests with a constant fixed size.
   */
  updateChartSize() {
    if (typeof jest !== 'undefined') {
      // Emulate chart size for tests
      this.props.onUpdateChartSize(chartSizeTestFallback);
    } else {
      // Use container bounds
      this.props.onUpdateChartSize(
        this.containerRef.current.getBoundingClientRect()
      );
    }
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
    const graphSize = this.props.graphSize;
    const width = graphSize.width + graphSize.marginx * 2;
    const height = graphSize.height + graphSize.marginy * 2;
    select(this.svgRef.current).attr('viewBox', `0 0 ${width} ${height}`);
  };

  /**
   * Remove viewBox once printing is done
   */
  handleAfterPrint = () => {
    select(this.svgRef.current).attr('viewBox', null);
  };

  /**
   * On every frame of every view transform change (from reset, pan, zoom etc.)
   * @param {Object} transform The current view transform
   */
  onViewChange(transform) {
    const { k: scale, x, y } = transform;

    // Apply animating class to zoom wrapper
    select(this.wrapperRef.current).classed(
      'pipeline-flowchart__zoom-wrapper--animating',
      true
    );

    // Update layer label y positions
    if (this.layerNamesRef?.current) {
      const layerNames = this.layerNamesRef.current.querySelectorAll(
        '.pipeline-layer-name'
      );
      this.props.layers.forEach((layer, i) => {
        const el = layerNames[i];
        if (!el) {
          return;
        }
        if (this.props.orientation === 'vertical') {
          const updateY = y + (layer.y + (layer.height || 0) / 2) * scale;
          el.style.transform = `translateY(${updateY}px)`;
        } else {
          const updateX = x + (layer.x + (layer.width || 0) / 2) * scale;
          el.style.transform = `translateX(${updateX}px) translateX(-50%)`;
        }
      });
    }

    // Update extents
    this.updateViewExtents(transform);
    const extents = getViewExtents(this.view);

    // Share the applied zoom state with other components
    this.props.onUpdateZoom({
      scale,
      x,
      y,
      applied: true,
      transition: false,
      relative: false,
      minScale: extents.scale.minK,
      maxScale: extents.scale.maxK,
    });
  }

  /**
   * Called when the view changes have ended (i.e. after transition ends)
   */
  onViewChangeEnd() {
    select(this.wrapperRef.current).classed(
      'pipeline-flowchart__zoom-wrapper--animating',
      false
    );
  }

  /**
   * Updates view extents based on the current view transform.
   * Offsets the extents considering any open sidebars.
   * Allows additional margin for user panning within limits.
   * Zoom scale is limited to a practical range for usability.
   * @param {?Object} transform Current transform override
   */
  updateViewExtents(transform) {
    const { k: scale } = transform || getViewTransform(this.view);

    const {
      sidebarWidth = 0,
      metaSidebarWidth = 0,
      codeSidebarWidth = 0,
      width: chartWidth = 0,
      height: chartHeight = 0,
    } = this.props.chartSize;

    const { width: graphWidth = 0, height: graphHeight = 0 } =
      this.props.graphSize;

    const leftSidebarOffset = sidebarWidth / scale;
    const rightSidebarOffset = (metaSidebarWidth + codeSidebarWidth) / scale;
    const margin = MARGIN;

    // Find the relative minimum scale to fit whole graph
    const minScale = Math.min(
      chartWidth / (graphWidth || 1),
      chartHeight / (graphHeight || 1)
    );

    setViewExtents(this.view, {
      translate: {
        minX: -leftSidebarOffset - margin,
        maxX: graphWidth + margin + rightSidebarOffset,
        minY: -margin,
        maxY: graphHeight + margin,
      },
      scale: {
        minK: MIN_SCALE * minScale,
        maxK: MAX_SCALE,
      },
    });
  }

  /**
   * Applies the given zoom state as necessary
   * @param {Object} chartZoom The new zoom state
   */
  onChartZoomChanged(chartZoom) {
    // No change if already applied (e.g. was an internal update)
    if (chartZoom.applied) {
      return;
    }

    // Apply reset if it was requested
    if (chartZoom.reset === true) {
      this.resetView(true);
      return;
    }

    // Set the view while respecting extents
    setViewTransform(
      this.view,
      { x: chartZoom.x, y: chartZoom.y, k: chartZoom.scale },
      chartZoom.transition ? DURATION * 0.3 : 0,
      chartZoom.relative
    );
  }

  /**
   * Zoom and scale to fit graph and any selected node in view
   */
  resetView(preventZoom) {
    const { chartSize, graphSize, clickedNode, nodes, orientation } =
      this.props;
    const { width: chartWidth, height: chartHeight } = chartSize;
    const { width: graphWidth, height: graphHeight } = graphSize;

    // Skip if chart or graph is not ready yet
    if (!chartWidth || !graphWidth) {
      return;
    }

    // Sidebar offset
    const offset = { x: chartSize.sidebarWidth, y: 0 };

    // Use the selected node as focus point
    const focus = clickedNode
      ? nodes.find((node) => node.id === clickedNode)
      : null;

    // Find a transform that fits everything in view

    const transform = viewTransformToFit({
      offset,
      focus,
      viewWidth: chartWidth,
      viewHeight: chartHeight,
      objectWidth: graphWidth,
      objectHeight: graphHeight,
      sidebarWidth: chartSize.sidebarWidth,
      minScaleX: 0.05,
      minScaleFocus: this.props.visibleMetaSidebar
        ? this.props.chartZoom.scale
        : 0.1,
      focusOffset: 0,
      preventZoom,
      orientation,
    });

    // Detect first transform
    const isFirstTransform = isOrigin(getViewTransform(this.view));

    // Apply transform ignoring extents
    setViewTransformExact(
      this.view,
      transform,
      isFirstTransform ? 0 : DURATION,
      false
    );
  }

  /**
   * Returns parameter count when there are more
   * than one parameters and parameter name if there's a single parameter
   * @param {Array} parameterNames
   * @returns {String}
   */
  getHoveredParameterLabel = (parameterNames) =>
    parameterNames.length > 1
      ? `Parameters:${parameterNames.length}`
      : parameterNames[0];

  /**
   * Enable a node's focus state and highlight linked nodes
   * @param {Object} event Event object
   * @param {Object} node Datum for a single node
   */
  handleNodeClick = (event, node) => {
    const { type, id } = node;
    const { onClickToExpandModularPipeline } = this.props;

    if (type === 'modularPipeline') {
      onClickToExpandModularPipeline(id);
    } else {
      this.handleSingleNodeClick(node);
    }

    event.stopPropagation();
  };

  handleSingleNodeClick = (node) => {
    const { id } = node;
    const {
      displayMetadataPanel,
      onLoadNodeData,
      onToggleNodeClicked,
      toSelectedNode,
    } = this.props;

    // Handle metadata panel display or node click toggle
    displayMetadataPanel ? onLoadNodeData(id) : onToggleNodeClicked(id);
    toSelectedNode(node);
  };

  /**
   * Determines the correct order of nodes based on their positions.
   * @param {string} fromNodeId - 'From' node ID.
   * @param {string} toNodeId - 'To' node ID.
   * @returns {Object} - Object containing updatedFromNodeId and updatedToNodeId.
   */
  determineNodesOrder = (fromNodeId, toNodeId) => {
    // Get bounding client rects of nodes
    const fromNodeElement = document.querySelector(`[data-id="${fromNodeId}"]`);
    const toNodeElement = document.querySelector(`[data-id="${toNodeId}"]`);

    if (!fromNodeElement || !toNodeElement) {
      return {
        updatedFromNodeId: null,
        updatedToNodeId: null,
      }; // If any element is missing, return nulls
    }

    const fromNodeRect = fromNodeElement.getBoundingClientRect();
    const toNodeRect = toNodeElement.getBoundingClientRect();

    // Reorder based on their Y-coordinate
    return fromNodeRect.y < toNodeRect.y
      ? { updatedFromNodeId: fromNodeId, updatedToNodeId: toNodeId }
      : { updatedFromNodeId: toNodeId, updatedToNodeId: fromNodeId };
  };

  /**
   * Remove a node's focus state and dim linked nodes
   */
  handleChartClick = (event) => {
    // If a node was previously clicked, clear the selected node data and reset the URL.
    if (this.props.clickedNode) {
      this.props.onLoadNodeData(null);
      // To reset URL to current active pipeline when click outside of a node on flowchart
      this.props.toSelectedPipeline();
    }
  };

  /**
   * Enable a node's active state, show tooltip, and highlight linked nodes
   * @param {Object} event Event object
   * @param {Object} node Datum for a single node
   */
  handleNodeMouseOver = (event, node) => {
    if (node.type === 'modularPipeline') {
      this.props.onToggleModularPipelineActive(node.id, true);
    } else {
      this.props.onToggleNodeHovered(node.id);
    }
    node && this.showTooltip(event, node.fullName);
  };

  /**
   * Enable a layer's active state when hovering it, update labelName's active className accordingly
   * @param {Object} event Event object
   * @param {Object} node Datum for a single node
   */
  handleLayerMouseOver = (event, node) => {
    if (!node) {
      return;
    }
    const layerName = document.querySelector(
      `[data-id="layer-label--${node.name}"]`
    );

    if (layerName) {
      layerName.classList.add('pipeline-layer-name--active');
    }
  };

  /**
   * Remove the current labelName's active className when not hovering, and update layer's active state accordingly
   * @param {Object} event Event object
   * @param {Object} node Datum for a single node
   */
  handleLayerMouseOut = (event, node) => {
    if (!node) {
      return;
    }
    const layerName = document.querySelector(
      `[data-id="layer-label--${node.name}"]`
    );
    if (layerName) {
      layerName.classList.remove('pipeline-layer-name--active');
    }
    this.setState({
      activeLayer: undefined,
    });
  };

  /**
   * Shows tooltip when the parameter indicator is hovered on
   * @param {Object} event Event object
   * @param {Object} node Datum for a single node
   */
  handleParamsIndicatorMouseOver = (event, node) => {
    const parameterNames = this.props.nodesWithInputParams[node.id];
    if (parameterNames) {
      const label = this.getHoveredParameterLabel(parameterNames);

      this.showTooltip(event, label);
    }
    event.stopPropagation();
  };

  /**
   * Remove a node's active state, hide tooltip, and dim linked nodes
   * @param {Object} node Datum for a single node
   */
  handleNodeMouseOut = (event, node) => {
    if (node.type === 'modularPipeline') {
      this.props.onToggleModularPipelineActive(node.id, false);
    } else {
      this.props.onToggleNodeHovered(null);
    }
    this.hideTooltip();
  };

  /**
   * Handle keydown event when a node is focused
   * @param {Object} event Event object
   * @param {Object} node Datum for a single node
   */
  handleNodeKeyDown = (event, node) => {
    const ENTER = 13;
    const ESCAPE = 27;
    if (event.keyCode === ENTER) {
      this.handleNodeClick(event, node);
    }
    if (event.keyCode === ESCAPE) {
      this.handleChartClick(event);
      this.handleNodeMouseOut();
    }
  };

  /**
   * Show, fill and and position the tooltip
   * @param {Object} event Event object
   * @param {Object} text Text to show on the tooltip
   * @param {?Object} options Options for the tooltip if required
   */
  showTooltip(event, text, options = {}) {
    this.setState({
      tooltip: {
        targetRect: event && event.target.getBoundingClientRect(),
        text: text,
        visible: true,
        ...options,
      },
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
          visible: false,
        },
      });
    }
  }

  /**
   * Render React elements
   */
  render() {
    const {
      chartSize,
      displayGlobalNavigation,
      displaySidebar,
      layers,
      visibleGraph,
      clickedNode,
      nodes,
      nodeActive,
      nodeSelected,
      nodeTypeDisabled,
      hoveredParameters,
      hoveredFocusMode,
      nodesWithInputParams,
      inputOutputDataNodes,
      focusMode,
      orientation,
      edges,
      linkedNodes,
      inputOutputDataEdges,
      nodesStatus,
      dataSetsStatus,
    } = this.props;
    const { outerWidth = 0, outerHeight = 0 } = chartSize;

    return (
      <div
        className="pipeline-flowchart kedro"
        ref={this.containerRef}
        onClick={this.handleChartClick}
      >
        <GraphSVG
          width={outerWidth}
          height={outerHeight}
          svgRef={this.svgRef}
          wrapperRef={this.wrapperRef}
          visibleGraph={visibleGraph}
        >
          <DrawLayersGroup
            layers={layers}
            layersRef={this.layersRef}
            onLayerMouseOver={this.handleLayerMouseOver}
            onLayerMouseOut={this.handleLayerMouseOut}
          />
          <DrawEdges
            edges={edges}
            clickedNode={clickedNode}
            linkedNodes={linkedNodes}
            focusMode={focusMode}
            inputOutputDataEdges={inputOutputDataEdges}
          />
          <DrawNodes
            nodes={nodes}
            nodeActive={nodeActive}
            nodeSelected={nodeSelected}
            nodeTypeDisabled={nodeTypeDisabled}
            hoveredParameters={hoveredParameters}
            hoveredFocusMode={hoveredFocusMode}
            nodesWithInputParams={nodesWithInputParams}
            inputOutputDataNodes={inputOutputDataNodes}
            focusMode={focusMode}
            orientation={orientation}
            onNodeClick={this.handleNodeClick}
            onNodeMouseOver={this.handleNodeMouseOver}
            onNodeMouseOut={this.handleNodeMouseOut}
            onNodeFocus={this.handleNodeMouseOver}
            onNodeBlur={this.handleNodeMouseOut}
            onNodeKeyDown={this.handleNodeKeyDown}
            onParamsIndicatorMouseOver={this.handleParamsIndicatorMouseOver}
            clickedNode={clickedNode}
            linkedNodes={linkedNodes}
            showRunStatus={true}
            nodesStatus={nodesStatus}
            dataSetsStatus={dataSetsStatus}
          />
        </GraphSVG>
        <DrawLayerNamesGroup
          layers={layers}
          displayGlobalNavigation={displayGlobalNavigation}
          displaySidebar={displaySidebar}
          chartSize={chartSize}
          orientation={orientation}
          layerNamesRef={this.layerNamesRef}
        />
        <Tooltip
          chartSize={chartSize}
          {...this.state.tooltip}
          style={{ fontSize: '1.5em' }}
        />
      </div>
    );
  }
}

// Fixed chart size used in tests
export const chartSizeTestFallback = {
  left: 0,
  top: 0,
  right: 1280,
  bottom: 1024,
  width: 1280,
  height: 1024,
};

// Maintain a single reference to support change detection
const emptyEdges = [];
const emptyNodes = [];
const emptyGraphSize = {};

export const mapStateToProps = (state, ownProps) => ({
  clickedNode: state.node.clicked,
  chartSize: getChartSize(state),
  chartZoom: getChartZoom(state),
  displayGlobalNavigation: state.display.globalNavigation,
  displaySidebar: state.display.sidebar,
  displayMetadataPanel: state.display.metadataPanel,
  edges: state.graph.edges || emptyEdges,
  focusMode: state.visible.modularPipelineFocusMode,
  graphSize: state.graph.size || emptyGraphSize,
  hoveredParameters: state.hoveredParameters,
  hoveredFocusMode: state.hoveredFocusMode,
  layers: getLayers(state),
  linkedNodes: getLinkedNodes(state),
  nodes: state.graph.nodes || emptyNodes,
  nodeTypeDisabled: state.nodeType.disabled,
  nodeActive: getNodeActive(state),
  nodeSelected: getNodeSelected(state),
  nodesWithInputParams: getNodesWithInputParams(state),
  modularPipelineIds: state.modularPipeline.ids,
  orientation: state.orientation,
  inputOutputDataNodes: getInputOutputNodesForFocusedModularPipeline(state),
  inputOutputDataEdges: getInputOutputDataEdges(state),
  visibleGraph: state.visible.graph,
  visibleSidebar: state.visible.sidebar,
  visibleCode: state.visible.code,
  visibleMetaSidebar: getVisibleMetaSidebar(state),
  nodeReFocus: state.behaviour.reFocus,
  runCommand: getRunCommand(state),
  nodesStatus: getNodesStatus(state),
  dataSetsStatus: getDatasetsStatus(state),
  ...ownProps,
});

export const mapDispatchToProps = (dispatch, ownProps) => ({
  onClickToExpandModularPipeline: (modularPipelineId) => {
    dispatch(toggleSingleModularPipelineExpanded(modularPipelineId));
  },
  onLoadNodeData: (nodeClicked) => {
    dispatch(loadNodeData(nodeClicked));
  },
  onToggleNodeClicked: (id) => {
    dispatch(toggleNodeClicked(id));
  },
  onToggleModularPipelineActive: (modularPipelineIDs, active) => {
    dispatch(toggleModularPipelineActive(modularPipelineIDs, active));
  },
  onToggleNodeHovered: (nodeHovered) => {
    dispatch(toggleNodeHovered(nodeHovered));
  },
  onUpdateChartSize: (chartSize) => {
    dispatch(updateChartSize(chartSize));
  },
  onUpdateZoom: (transform) => {
    dispatch(updateZoom(transform));
  },
  ...ownProps,
});

export default connect(mapStateToProps, mapDispatchToProps)(Workflow);
