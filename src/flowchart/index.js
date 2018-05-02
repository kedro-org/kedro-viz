import React, { Component } from 'react';
import { select, event } from 'd3-selection';
import { curveBasis } from 'd3-shape';
import { scaleOrdinal } from 'd3-scale';
import { zoom, zoomIdentity } from 'd3-zoom';
import DagreD3 from 'dagre-d3';
import generateRandomData from '../utils/randomData';
import database from './database.svg';
import './flowchart.css';

class FlowChart extends Component {
  constructor(props) {
    super(props);
    this.data = generateRandomData();
    this.dagreD3 = {};
    this.state = {
      textLabels: false
    };
    this.setChartHeight = this.setChartHeight.bind(this);
  }

  componentDidMount() {
    this.svg = select(this._svg);
    this.inner = select(this._gInner);
    this.tooltip = select(this._tooltip);

    this.setChartHeight();
    window.addEventListener('resize', this.setChartHeight);
    this.setScales();
    this.setupChart();
    this.drawChart(false);
  }

  componentWillUnmount() {
    document.removeEventListener('resize', this.setChartHeight);
  }

  setChartHeight() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.svg.attr('width', this.width).attr('height', this.height);
  }

  setScales() {
    this.scale = {
      colour: scaleOrdinal()
        .domain(this.data.layers.map(d => d.id))
        .range(
          this.data.layers.map(
            (d, i) => `hsl(${i * (360 / this.data.layers.length)}, 50%, 70%)`
          )
        )
    };
  }
  setupChart() {
    this.dagreD3.graph = new DagreD3.graphlib.Graph({ compound: true })
      .setGraph({
        marginx: 50,
        marginy: 50
      })
      .setDefaultEdgeLabel(() => ({}));

    // Create the renderer
    this.dagreD3.render = new DagreD3.render();

    // Initialize zoom behaviour
    this.zoomBehaviour = zoom().on('zoom', () => {
      this.inner.attr('transform', event.transform);
    });
    this.svg.call(this.zoomBehaviour);

    // Add transition animations
    this.dagreD3.graph.graph().transition = selection =>
      selection.transition().duration(500);
  }

  // Update node and link data
  updata() {
    const { textLabels } = this.state;
    const { graph } = this.dagreD3;
    const { nodes, links } = this.data;

    nodes.forEach(d => {
      graph.setNode(d.id, {
        data: d,
        labelType: 'html',
        label: textLabels
          ? d.name
          : `<img
              src="${database}"
              width="25"
              height="25"
              transform="translateY(4px)"
              alt="${d.id}" />`,
        shape: textLabels ? 'rect' : 'circle',
        style: `fill: ${this.scale.colour(d.layer.id)}`
      });
    });

    links.forEach(d => {
      graph.setEdge(d.source.id, d.target.id, {
        arrowhead: 'vee',
        curve: curveBasis
      });
    });
  }

  getLinkedNodes(nodeID) {
    const { links } = this.data;
    const linkedNodes = [];

    (function getParents(id) {
      links.filter(d => d.target.id === id).forEach(d => {
        linkedNodes.push(d.source);
        getParents(d.source.id);
      });
    })(+nodeID);

    (function getChildren(id) {
      links.filter(d => d.source.id === id).forEach(d => {
        linkedNodes.push(d.target);
        getChildren(d.target.id);
      });
    })(+nodeID);

    return linkedNodes;
  }

  drawChart(isUpdate) {
    const { textLabels } = this.state;
    const { graph, render } = this.dagreD3;
    this.updata();

    // Reset zoom before rendering HTML nodes to force them to scale properly
    // when appending to the DOM
    if (isUpdate) {
      this.svg.call(this.zoomBehaviour.transform, zoomIdentity.scale(1));
    }

    // Run the renderer. This is what draws the final graph.
    this.inner.call(render, graph);

    // Zoom and scale to fit
    const { width, height } = graph.graph();
    const zoomScale = Math.min(this.width / width, this.height / height);
    const translateX = this.width / 2 - width * zoomScale / 2;
    const translateY = this.height / 2 - height * zoomScale / 2;
    const svgZoom = isUpdate ? this.svg.transition().duration(500) : this.svg;
    svgZoom.call(
      this.zoomBehaviour.transform,
      zoomIdentity.translate(translateX, translateY).scale(zoomScale)
    );

    const nodes = this.inner.selectAll('.node');

    nodes
      .on('mouseover', () => {
        this.tooltip.classed('tooltip--visible', true);
      })
      .on('mouseout', () => {
        this.tooltip.classed('tooltip--visible', false);
        nodes.classed('node--highlighted', false);
      })
      .on('mousemove', d => {
        const node = graph.node(d);
        const { clientX, clientY } = event;
        const isRight = clientX > this.width / 2;
        const x = isRight ? clientX - this.width : clientX;
        this.tooltip
          .classed('tooltip--visible', true)
          .classed('tooltip--right', isRight)
          .html(
            `<b>${node.data.name}</b><small>${node.data.layer.name}</small>`
          )
          .style('transform', `translate(${x}px, ${clientY}px)`);
        const linkedNodes = this.getLinkedNodes(d).map(d => d.id);
        nodes.classed(
          'node--highlighted',
          dd => linkedNodes.includes(+dd) || dd == d
        );
      });
  }

  render() {
    return (
      <div className="flowchart">
        <div className="flowchart__ui">
          <button
            onClick={() => {
              this.setState({ textLabels: !this.state.textLabels }, () => {
                this.drawChart(true);
              });
            }}>
            Toggle labels
          </button>
        </div>
        <svg
          className="flowchart__graph"
          ref={el => (this._svg = el)}
          width="960"
          height="600">
          <g ref={el => (this._gInner = el)} />
        </svg>
        <div className="flowchart__tooltip" ref={el => (this._tooltip = el)} />
      </div>
    );
  }
}

export default FlowChart;
