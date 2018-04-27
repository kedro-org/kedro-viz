import React, { Component } from 'react';
import { select, event } from 'd3-selection';
import { curveBasis } from 'd3-shape';
import { scaleOrdinal } from 'd3-scale';
import { zoom } from 'd3-zoom';
import DagreD3 from 'dagre-d3';
import generateRandomData from '../utils/randomData';
import './flowchart.css';

class FlowChart extends Component {
  constructor(props) {
    super(props);
    this.data = generateRandomData();
  }

  componentDidMount() {
    this.svg = select(this._svg);
    this.setChartHeight();
    window.addEventListener('resize', this.setChartHeight.bind(this));
    this.setScales();
    this.makeChart();
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

  makeChart() {
    this.graph = new DagreD3.graphlib.Graph({ compound: true })
      .setGraph({})
      .setDefaultEdgeLabel(() => ({}));

    this.data.nodes.forEach(d => {
      this.graph.setNode(d.id, {
        data: d,
        label: () => {
          var icon = document.createElement('img');
          icon.setAttribute('src', '/database.svg');
          icon.setAttribute('width', 25);
          icon.setAttribute('height', 25);
          icon.setAttribute('transform', 'translateY(4px)');
          icon.setAttribute('alt', d.id);
          return icon;
        },
        shape: 'circle',
        style: `fill: ${this.scale.colour(d.layer.id)}`
      });
    });

    this.data.links.forEach(d => {
      this.graph.setEdge(d.source.id, d.target.id, {
        arrowhead: 'vee',
        curve: curveBasis
      });
    });

    // Create the renderer
    const render = new DagreD3.render();

    // Set up an SVG group so that we can translate the final graph.
    const svg = select(this._svg);
    const zoomGroup = svg.append('g');
    const graphGroup = zoomGroup.append('g');

    this.graph.graph().transition = selection =>
      selection.transition().duration(500);

    // Run the renderer. This is what draws the final graph.
    render(graphGroup, this.graph);

    // Center the graph
    const offset = {
      x: (this.width - this.graph.graph().width) / 2,
      y: (this.height - this.graph.graph().height) / 2
    };
    graphGroup.attr('transform', `translate(${offset.x}, ${offset.y})`);

    // Initialize zoom behaviour
    const zoomBehaviour = zoom().on('zoom', () => {
      zoomGroup.attr('transform', event.transform);
    });
    svg.call(zoomBehaviour);

    const tooltip = select(this._tooltip);

    graphGroup
      .selectAll('.node')
      .on('mouseover', () => {
        tooltip.classed('tooltip--visible', true);
      })
      .on('mouseout', () => {
        tooltip.classed('tooltip--visible', false);
      })
      .on('mousemove', d => {
        const node = this.graph.node(d);
        const { clientX, clientY } = event;
        const isRight = clientX > this.width / 2;
        const x = isRight ? clientX - this.width : clientX;
        tooltip
          .classed('tooltip--visible', true)
          .classed('tooltip--right', isRight)
          .html(
            `<b>${node.data.name}</b><small>${node.data.layer.name}</small>`
          )
          .style('transform', `translate(${x}px, ${clientY}px)`);
      });
  }

  render() {
    return (
      <div className="flowchart">
        <svg
          className="flowchart__graph"
          ref={el => (this._svg = el)}
          width="960"
          height="600"
        />
        <div className="flowchart__tooltip" ref={el => (this._tooltip = el)} />
      </div>
    );
  }
}

export default FlowChart;
