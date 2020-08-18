import React, { Component } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import 'd3-transition';
import { interpolate } from 'd3-interpolate';
import { select, event } from 'd3-selection';
import { zoom, zoomIdentity, zoomTransform } from 'd3-zoom';
import { getNodeActive, getNodeSelected } from '../../selectors/nodes';
import { updateZoom } from '../../actions';
import { getChartSize, getChartZoom } from '../../selectors/layout';
import { getCentralNode, getLinkedNodes } from '../../selectors/linked-nodes';
import { drawNodes, drawViewport } from './draw';
import './styles/minimap.css';

/**
 * Display a pipeline minimap, mostly rendered with D3
 */
export class MiniMap extends Component {
  constructor(props) {
    super(props);

    this.DURATION = 700;
    this.TRANSITION_WAIT = 200;
    this.ZOOM_RATE = 0.0025;
    this.isPointerDown = false;
    this.isPointerInside = false;
    this.lastTransitionTime = 0;

    this.containerRef = React.createRef();
    this.svgRef = React.createRef();
    this.wrapperRef = React.createRef();
    this.nodesRef = React.createRef();
    this.viewportRef = React.createRef();

    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerEnter = this.onPointerEnter.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerWheel = this.onPointerWheel.bind(this);
    this.onPointerWheelGlobal = this.onPointerWheelGlobal.bind(this);
    this.onPointerUpGlobal = this.onPointerUpGlobal.bind(this);
  }

  componentDidMount() {
    this.selectD3Elements();
    this.initZoomBehaviour();
    this.addGlobalEventListeners();
    drawNodes.call(this);
  }

  componentWillUnmount() {
    this.removeGlobalEventListeners();
  }

  /**
   * Add window event listeners
   */
  addGlobalEventListeners() {
    document.body.addEventListener('wheel', this.onPointerWheelGlobal, {
      passive: false
    });
    document.body.addEventListener(
      pointerEventName('pointerup'),
      this.onPointerUpGlobal
    );
  }

  /**
   * Remove window event listeners
   */
  removeGlobalEventListeners() {
    document.body.removeEventListener('wheel', this.onPointerWheelGlobal);
    document.body.removeEventListener(
      pointerEventName('pointerup'),
      this.onPointerUpGlobal
    );
  }

  componentDidUpdate(prevProps) {
    const { visible, chartZoom } = this.props;

    if (visible) {
      const changed = (...names) => this.changed(names, prevProps, this.props);

      if (
        changed(
          'visible',
          'nodes',
          'centralNode',
          'linkedNodes',
          'nodesActive',
          'nodeSelected'
        )
      ) {
        drawNodes.call(this);
      }

      if (changed('visible', 'chartZoom') && chartZoom.applied) {
        drawViewport.call(this);
      }

      if (changed('visible', 'nodes', 'textLabels', 'chartSize')) {
        this.zoomToFit();
      }
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
      nodeGroup: select(this.nodesRef.current),
      viewport: select(this.viewportRef.current)
    };
  }

  /**
   * Setup D3 zoom behaviour on component mount
   */
  initZoomBehaviour() {
    // Create zoom behaviour
    this.zoomBehaviour = zoom()
      // Ignore all user input default behaviour
      .filter(() => false)
      // Transition using linear interpolation
      .interpolate(interpolate)
      // When zoom changes
      .on('zoom', () => {
        // Transform the <g> that wraps the map
        this.el.wrapper.attr('transform', event.transform);
      });

    this.el.svg.call(this.zoomBehaviour);
  }

  /**
   * Handle pointer enter
   */
  onPointerEnter = () => {
    this.isPointerInside = true;
  };

  /**
   * Handle pointer leave
   */
  onPointerLeave = () => {
    this.isPointerInside = false;
  };

  /**
   * Handle global pointer up
   */
  onPointerUpGlobal = () => {
    this.isPointerDown = false;
    this.isPointerInside = false;
  };

  /**
   * Handle pointer down
   * @param {Object} event Event object
   */
  onPointerDown = event => {
    this.isPointerDown = true;
    this.isPointerInside = true;

    this.onPointerMove(event, true);
  };

  /**
   * Handle pointer wheel
   * @param {Object} event Event object
   */
  onPointerWheel = event => {
    const { scale = 1 } = this.props.chartZoom;

    // Change zoom based on wheel velocity
    this.props.onUpdateChartZoom({
      scale: scale - (event.deltaY || 0) * scale * this.ZOOM_RATE,
      applied: false,
      transition: false
    });
  };

  /**
   * Handle global pointer wheel
   * @param {Object} event Event object
   */
  onPointerWheelGlobal = event => {
    // Prevent window scroll when wheeling on this minimap
    const wasTarget = this.containerRef.current.contains(event.target);
    if (wasTarget) {
      event.preventDefault();
    }
  };

  /**
   * Handle pointer move
   * @param {Object} event Event object
   * @param {?Boolean} useTransition Apply with transition
   */
  onPointerMove = (event, useTransition = false) => {
    if (this.isPointerDown && this.isPointerInside) {
      // Wait for transition
      const time = Number(new Date());
      if (time - this.lastTransitionTime < this.TRANSITION_WAIT) {
        return;
      }

      // Get current state
      const { width, height } = this.props.mapSize;
      const { width: graphWidth, height: graphHeight } = this.props.graphSize;
      const { k: scale = 1 } = zoomTransform(this.wrapperRef.current);
      const containerRect = this.svgRef.current.getBoundingClientRect();

      // Transform minimap pointer position to a graph position
      const pointerX = event.clientX - containerRect.x;
      const pointerY = event.clientY - containerRect.y;
      const centerX = (width / scale - graphWidth) * 0.5;
      const centerY = (height / scale - graphHeight) * 0.5;
      const x = (pointerX / width) * (width / scale) - centerX;
      const y = (pointerY / height) * (height / scale) - centerY;

      // Dispatch an update to be applied
      this.props.onUpdateChartZoom({
        x,
        y,
        applied: false,
        transition: useTransition
      });

      if (useTransition) {
        this.lastTransitionTime = time;
      }
    }
  };

  /**
   * Zoom and scale to fit
   */
  zoomToFit() {
    const { mapSize, graphSize } = this.props;

    let scale = 1;
    let translateX = 0;
    let translateY = 0;

    // Fit the graph exactly in the viewport
    if (mapSize.width > 0 && graphSize.width > 0) {
      scale = Math.min(
        (mapSize.width - padding) / graphSize.width,
        (mapSize.height - padding) / graphSize.height
      );
      translateX = (mapSize.width - graphSize.width * scale) / 2;
      translateY = (mapSize.height - graphSize.height * scale) / 2;
    }

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
   * Get the position of the viewport relative to the minimap
   */
  getViewport() {
    const { chartZoom, chartSize } = this.props;
    const { k: mapScale, x: translateX, y: translateY } = zoomTransform(
      this.wrapperRef.current
    );

    const scale = mapScale / chartZoom.scale;
    const width = chartSize.width * scale;
    const height = chartSize.height * scale;
    const x = translateX - (chartZoom.x - chartSize.sidebarWidth) * scale;
    const y = translateY - chartZoom.y * scale;

    return { x, y, width, height };
  }

  /**
   * Render React elements
   */
  render() {
    const { width, height } = this.props.mapSize;
    const transformStyle = {
      transform: `translate(calc(-100% + ${width}px), -100%)`
    };

    // Add pointer events with back compatibility
    const _ = pointerEventName;
    const inputEvents = {
      onWheel: this.onPointerWheel,
      [_('onPointerEnter')]: this.onPointerEnter,
      [_('onPointerLeave')]: this.onPointerLeave,
      [_('onPointerDown')]: this.onPointerDown,
      [_('onPointerMove')]: this.onPointerMove
    };

    return (
      <div
        className={classnames('pipeline-minimap-container', {
          'pipeline-minimap-container--visible': this.props.visible
        })}
        style={this.props.visible ? transformStyle : {}}>
        <div
          className="pipeline-minimap kedro"
          ref={this.containerRef}
          {...inputEvents}>
          <svg
            id="pipeline-minimap-graph"
            className="pipeline-minimap__graph"
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            ref={this.svgRef}>
            <g id="zoom-wrapper" ref={this.wrapperRef}>
              <g
                id="minimap-nodes"
                className="pipeline-minimap__nodes"
                ref={this.nodesRef}
              />
            </g>
            <rect
              className="pipeline-minimap__viewport"
              ref={this.viewportRef}
            />
          </svg>
        </div>
      </div>
    );
  }
}

// Map sizing constants
const padding = 32;
const height = 220;
const minWidth = 218;
const maxWidth = 1.5 * minWidth;

// Detect if pointer events are supported
const hasPointerEvents = Boolean(window.PointerEvent);

/**
 * Convert pointer event name to a mouse event name if not supported
 */
const pointerEventName = event =>
  hasPointerEvents
    ? event
    : event.replace('pointer', 'mouse').replace('Pointer', 'Mouse');

/**
 * Gets the map sizing that fits the graph in state
 */
const getMapSize = state => {
  const size = state.graph.size || {};
  const graphWidth = size.width || 0;
  const graphHeight = size.height || 0;

  if (graphWidth > 0 && graphHeight > 0) {
    // Constrain width
    const scaledWidth = graphWidth * (height / graphHeight);
    const width = Math.min(Math.max(scaledWidth, minWidth), maxWidth);

    return { width, height };
  }

  // Use minimum size if no graph
  return { width: minWidth, height: height };
};

// Maintain a single reference to support change detection
const emptyNodes = [];
const emptyGraphSize = {};

export const mapStateToProps = state => ({
  visible: state.visible.miniMap,
  mapSize: getMapSize(state),
  centralNode: getCentralNode(state),
  chartSize: getChartSize(state),
  chartZoom: getChartZoom(state),
  graphSize: state.graph.size || emptyGraphSize,
  nodes: state.graph.nodes || emptyNodes,
  linkedNodes: getLinkedNodes(state),
  nodeActive: getNodeActive(state),
  nodeSelected: getNodeSelected(state),
  textLabels: state.textLabels
});

export const mapDispatchToProps = dispatch => ({
  onUpdateChartZoom: transform => {
    dispatch(updateZoom(transform));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MiniMap);
