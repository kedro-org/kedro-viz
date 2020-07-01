import React, { Component } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import 'd3-transition';
import { select, event } from 'd3-selection';
import { zoom, zoomIdentity, zoomTransform } from 'd3-zoom';
import { getNodeActive, getNodeSelected } from '../../selectors/nodes';
import { updateZoom } from '../../actions';
import {
  getChartSize,
  getGraphSize,
  getLayoutNodes,
  getZoomPosition,
  getChartZoom
} from '../../selectors/layout';
import { getCentralNode, getLinkedNodes } from '../../selectors/linked-nodes';
import { drawNodes, drawViewport } from './draw';
import './styles/minimap.css';

/**
 * Display a pipeline minimap, mostly rendered with D3
 */
export class MiniMap extends Component {
  constructor(props) {
    super(props);

    this.DURATION = 400;
    this.SCALE = 0.85;
    this.userPanning = false;

    this.containerRef = React.createRef();
    this.svgRef = React.createRef();
    this.wrapperRef = React.createRef();
    this.nodesRef = React.createRef();
    this.viewportRef = React.createRef();
  }

  componentDidMount() {
    this.selectD3Elements();
    this.initZoomBehaviour();
    drawNodes.call(this);
  }

  componentDidUpdate(prevProps) {
    if (this.props.visible) {
      if (
        this.changed(
          [
            'visible',
            'nodes',
            'centralNode',
            'linkedNodes',
            'nodesActive',
            'nodeSelected'
          ],
          prevProps,
          this.props
        )
      ) {
        drawNodes.call(this);
      }

      if (this.changed(['visible', 'chartZoom'], prevProps, this.props)) {
        drawViewport.call(this);
      }

      if (
        this.changed(
          ['visible', 'nodes', 'textLabels'],
          prevProps,
          this.props
        ) ||
        this.changed(['width', 'height'], prevProps.mapSize, this.props.mapSize)
      ) {
        this.zoomMap();
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
    this.zoomBehaviour = zoom()
      .on('start', () => {
        const viewportClicked =
          event.sourceEvent &&
          event.sourceEvent.target === this.viewportRef.current;
        this.userPanning = viewportClicked;
      })
      .on('end', () => {
        this.userPanning = false;
      })
      .on('zoom', () => {
        const isUserInput = Boolean(event.sourceEvent);

        if (!isUserInput) {
          // Transform the <g> that wraps the map
          this.el.wrapper.attr('transform', event.transform);
        } else if (this.userPanning) {
          const { scale, x, y } = this.props.chartZoom;
          const dx = event.sourceEvent.movementX / event.transform.k;
          const dy = event.sourceEvent.movementY / event.transform.k;

          this.props.onUpdateChartZoom({
            scale,
            x: x - dx,
            y: y - dy,
            applied: false,
            transition: false
          });
        }
      });

    this.el.svg.call(this.zoomBehaviour).on('dblclick.zoom', null);
  }

  /**
   * Zoom and scale to fit
   */
  zoomMap() {
    const {
      scale = 1,
      translateX = 0,
      translateY = 0
    } = this.getZoomPosition();

    const { k = 1, x = 0, y = 0 } = zoomTransform(this.wrapperRef.current);

    if (k === 1 && x === 0 && y === 0) {
      this.el.svg.call(
        this.zoomBehaviour.transform,
        zoomIdentity.translate(translateX, translateY).scale(scale)
      );
    } else {
      this.el.svg
        .transition()
        .duration(this.DURATION)
        .call(
          this.zoomBehaviour.transform,
          zoomIdentity.translate(translateX, translateY).scale(scale)
        );
    }
  }

  getZoomPosition() {
    const { graphSize, mapSize } = this.props;

    if (!mapSize.width || !graphSize.width) {
      return {
        scale: 1,
        translateX: 0,
        translateY: 0
      };
    }

    const scale =
      this.SCALE *
      Math.min(
        mapSize.width / graphSize.width,
        mapSize.height / graphSize.height
      );

    const translateX = mapSize.width / 2 - (graphSize.width * scale) / 2;
    const translateY = mapSize.height / 2 - (graphSize.height * scale) / 2;

    return {
      scale,
      translateX,
      translateY
    };
  }

  /**
   * Render React elements
   */
  render() {
    const { width, height } = this.props.mapSize;
    const transformStyle = {
      transform: `translate(calc(-100% + ${width}px), -100%)`
    };

    return (
      <div
        className={classnames('pipeline-minimap-container', {
          'pipeline-minimap-container--visible': this.props.visible
        })}
        style={this.props.visible ? transformStyle : {}}>
        <div className="pipeline-minimap kedro" ref={this.containerRef}>
          <svg
            id="pipeline-minimap-graph"
            className="pipeline-minimap__graph"
            width={width}
            height={height}
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

const height = 192;
const maxWidth = 500;
const minWidthHeightRatio = 0.8;
const maxWidthChartRatio = 0.2;

const getMapSize = state => {
  const size = getGraphSize(state);
  const aspect = (size.width || 1) / (size.height || 1);
  const chartSize = getChartSize(state);
  const chartWidth = chartSize.width || 0;

  // Constrain width to height, or chart size, or maximum value
  const width = Math.max(
    height * minWidthHeightRatio,
    Math.min(height * aspect, chartWidth * maxWidthChartRatio, maxWidth)
  );

  return { width, height };
};

export const mapStateToProps = state => ({
  visible: state.visible.miniMap,
  mapSize: getMapSize(state),
  centralNode: getCentralNode(state),
  chartSize: getChartSize(state),
  chartZoom: getChartZoom(state),
  graphSize: getGraphSize(state),
  nodes: getLayoutNodes(state),
  linkedNodes: getLinkedNodes(state),
  nodeActive: getNodeActive(state),
  nodeSelected: getNodeSelected(state),
  textLabels: state.textLabels,
  zoom: getZoomPosition(state)
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
