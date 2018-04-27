import React, { Component } from 'react';
import { select, event } from 'd3-selection';
import { curveBasis } from 'd3-shape';
import { scaleOrdinal } from 'd3-scale';
import { zoom } from 'd3-zoom';
import DagreD3 from 'dagre-d3';
import './flowchart.css';

const getArray = n => Array.from(Array(n).keys());

const getRandom = range => range[Math.floor(Math.random() * range.length)];

const first = arr => arr[0];
const last = arr => arr[arr.length - 1];

class FlowChart extends Component {
  componentDidMount() {
    this.svg = select(this._svg);
    this.setChartHeight();
    window.addEventListener('resize', this.setChartHeight.bind(this));
    this.generateRandomData();
    this.setScales();
    this.makeChart();
  }

  setChartHeight() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.svg.attr('width', this.width).attr('height', this.height);
  }

  generateRandomData() {
    const layers = [
      'Raw',
      'Intermediate',
      'Primary',
      'Feature',
      'Model Input',
      'Model Output'
    ].map((name, id) => ({ id, name }));

    const nodes = getArray(30).map((d, i, arr) => ({
      name: d + getRandom('QWERTYUIOPASDFGHJKLZXCVBNM'),
      layer: getRandom(layers).id
      // layer: Math.ceil((i / arr.length) * layers.length),
    }));

    const links = nodes.map((d, i) => {
      const source = d;
      const targets = nodes.filter(
        dd => dd.name !== source.name && dd.layer > source.layer
      );
      if (targets.length) {
        return {
          source,
          target: getRandom(targets)
        };
      }
      return {
        target: source,
        source: getRandom(nodes)
      };
    });

    this.data = {
      layers,
      nodes,
      links
    };
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
    this.svg
      .append('g')
      .attr('class', 'layers')
      .selectAll('rect')
      .data(this.data.layers)
      .enter()
      .append('rect')
      .attr('fill', d => this.scale.colour(d.id))
      .attr('fill-opacity', 0.3)
      .attr('x', 0)
      .attr('width', this.width)
      .attr('height', d => this.scale.y(d.length))
      .attr('y', d => this.scale.y(d.y0));

    this.svg
      .append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(this.data.links)
      .enter()
      .append('path')
      .attr('fill', 'none')
      .attr('stroke-width', 2)
      .attr('stroke', 'rgba(0,0,0,0.15)')
      .attr('d', this.scale.link);

    this.svg
      .append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(this.data.nodes)
      .enter()
      .append('circle')
      .attr('r', 15)
      .attr('fill', d => this.scale.colour(d.layer))
      .attr('title', d => d.name)
      .attr('cx', d => this.scale.x(d.name))
      .attr('cy', d => this.scale.y(d.level + 0.5));

    this.svg
      .append('g')
      .attr('class', 'text')
      .selectAll('text')
      .data(this.data.nodes)
      .enter()
      .append('text')
      .attr('fill', '#fff')
      .attr('text-anchor', 'middle')
      .attr('dy', '5')
      .text(d => d.name)
      .attr('x', d => this.scale.x(d.name))
      .attr('y', d => this.scale.y(d.level + 0.5));
  }

  makeChart2() {
    // Create the input graph
    this.graph = new DagreD3.graphlib.Graph({ compound: true })
      .setGraph({})
      .setDefaultEdgeLabel(() => ({}));

    // this.data.layers.forEach(d => {
    //   g.setNode(d.id, {
    //     label: d.name,
    //     clusterLabelPos: 'top',
    //     style: `fill: ${this.scale.colour(d.id)}`
    //   });
    // });

    this.data.nodes.forEach(d => {
      this.graph.setNode(d.name, {
        label: () => {
          var icon = document.createElement('img');
          icon.setAttribute('src', '/database.svg');
          icon.setAttribute('width', 25);
          icon.setAttribute('height', 25);
          icon.setAttribute('transform', 'translateY(4px)');
          icon.setAttribute('alt', d.name);
          return icon;
        },
        shape: 'circle',
        style: `fill: ${this.scale.colour(d.layer)}`
      });
      // this.graph.setParent(d.name, d.layer);
    });

    this.data.links.forEach(d => {
      this.graph.setEdge(d.source.name, d.target.name, {
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
  }

  render() {
    return (
      <div className="FlowChart">
        <svg ref={el => (this._svg = el)} width="960" height="600" />
      </div>
    );
  }
}

export default FlowChart;
