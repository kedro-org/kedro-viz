import React, { Component } from 'react';
import { connect } from 'react-redux';
import 'd3-transition';
import { select, event } from 'd3-selection';
import { zoom, zoomIdentity, zoomTransform } from 'd3-zoom';
import { getNodeActive, getNodeSelected } from '../../selectors/nodes';
import {
  getChartSize,
  getGraphSize,
  getLayoutNodes,
  getZoomPosition,
  getChartZoom
} from '../../selectors/layout';
import { getCentralNode, getLinkedNodes } from '../../selectors/linked-nodes';
import draw from './draw';
import './styles/minimap.css';

/**
 * Display a pipeline minimap, mostly rendered with D3
 */
export class MiniMap extends Component {
  constructor(props) {
    super(props);

    this.DURATION = 400;
    this.SCALE = 0.85;

    this.containerRef = React.createRef();
    this.svgRef = React.createRef();
    this.wrapperRef = React.createRef();
    this.nodesRef = React.createRef();
    this.viewportRef = React.createRef();
  }

  componentDidMount() {
    this.selectD3Elements();
    this.initZoomBehaviour();
  }

  componentDidUpdate(prevProps) {
    const { nodes, textLabels, mapSize, visible } = this.props;

    if (visible) {
      this.drawMap();

      if (
        prevProps.visible !== visible ||
        prevProps.nodes !== nodes ||
        prevProps.textLabels !== textLabels ||
        prevProps.mapSize.width !== mapSize.width ||
        prevProps.mapSize.height !== mapSize.height
      ) {
        this.zoomMap();
      }
    }
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
    this.zoomBehaviour = zoom().on('zoom', () => {
      // Transform the <g> that wraps the map
      this.el.wrapper.attr('transform', event.transform);
    });

    // Ignore all user inputs.
    this.zoomBehaviour.filter(() => false);

    this.el.svg.call(this.zoomBehaviour);
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
    const { k, x, y } = zoomTransform(this.wrapperRef.current);

    if (k === 1 && x === 0 && y === 0) {
      this.el.svg.call(
        this.zoomBehaviour.transform,
        zoomIdentity.translate(translateX, translateY).scale(scale)
      );
    }

    // Auto zoom to fit the map nicely on the page
    this.el.svg
      .transition()
      .duration(this.DURATION)
      .call(
        this.zoomBehaviour.transform,
        zoomIdentity.translate(translateX, translateY).scale(scale)
      );
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
   * Render map to the DOM with D3
   */
  drawMap() {
    draw.call(this);
  }

  /**
   * Render React elements
   */
  render() {
    const { width, height } = this.props.mapSize;

    return (
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
          <rect className="pipeline-minimap__viewport" ref={this.viewportRef} />
        </svg>
      </div>
    );
  }
}

const getMapSize = state => {
  const size = getGraphSize(state);
  const chartSize = getChartSize(state);
  const width = Math.max(
    120,
    Math.min(80 + size.width * 0.1, chartSize.width * 0.2)
  );
  const height = Math.max(
    120,
    Math.min(20 + size.height * 0.1, chartSize.height * 0.2)
  );
  return { width: width || 0, height: height || 0 };
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

export default connect(mapStateToProps)(MiniMap);
