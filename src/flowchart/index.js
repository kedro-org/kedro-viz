import React, { Component } from 'react';
import { select } from 'd3-selection';
import { linkVertical, stack } from 'd3-shape';
import { scaleLinear, scaleOrdinal, scalePoint } from 'd3-scale';
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
        dd => dd.name !== source.name && dd.layer >= source.layer
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

    return {
      layers,
      nodes,
      links
    };
  }

  /**
   * Experiment
   */
  calculatePaths(data) {
    // Convert each link into a path
    const paths = data.links.map(link => [link.source, link.target]);

    // Calculate all the possible paths through the flowchart,
    // and make each one a path array of nodes inside the paths array
    for (let i = 0; i < paths.length; i++) {
      for (let j = 0; j < paths.length; j++) {
        if (first(paths[i]).name === last(paths[j]).name) {
          paths[i] = paths[j].concat(paths[i].slice(1));
          paths.splice(j, 1);
          break;
        } else if (last(paths[i]).name === first(paths[j]).name) {
          paths[i] = paths[i].concat(paths[j].slice(1));
          paths.splice(j, 1);
          break;
        }
      }
    }

    // Get the length of the longest path for each layer
    data.yMax = 0;
    data.layers.forEach(layer => {
      // Get the y index for each node, corresponding to its relevant layer
      let layerY = 0;
      paths.forEach((path, i) => {
        let pathY = 0;
        path.forEach(node => {
          if (node.layer === layer.id) {
            const nodeLevel = pathY + data.yMax;
            if (typeof node.level === 'undefined' || nodeLevel > node.level) {
              node.level = pathY + data.yMax;
            }
            pathY++;
            if (pathY > layerY) {
              layerY = pathY;
            }
          }
        });
      });
      layer.length = layerY;
      data.yMax += layerY;
    });

    // Calculate start/end of each layer band, for stack viz
    data.layers.reduce((a, b) => {
      b.y0 = a;
      b.y1 = a + b.length;
      return b.y1;
    }, 0);

    data.paths = paths;

    return data;
  }

  setScales(data) {
    const scale = {
      x: scalePoint()
        .domain(data.nodes.map(d => d.name))
        .range([this.width * 0.2, this.width * 0.8]),

      y: scaleLinear()
        .domain([0, data.yMax])
        .range([0, this.height]),

      link: linkVertical()
        .x(d => scale.x(d.name))
        .y(d => scale.y(d.level + 0.5)),

      colour: scaleOrdinal()
        .domain(data.layers.map(d => d.id))
        .range(
          data.layers.map(
            (d, i) => `hsl(${i * (360 / data.layers.length)}, 50%, 70%)`
          )
        )
    };

    return scale;
  }

  makeChart() {
    // Generate data
    const data = this.generateRandomData();
    this.calculatePaths(data);
    const scale = this.setScales(data);

    // Add objects to the DOM

    // TODO remove this
    select('#pathlist')
      .selectAll('tr')
      .data(data.paths)
      .enter()
      .append('tr')
      .selectAll('td')
      .data(d => d)
      .enter()
      .append('td')
      .style('background', d => scale.colour(d.layer))
      .text(d => d.name || '');

    select('#nodelist')
      .selectAll('li')
      .data(data.nodes.sort((a, b) => a.level - b.level))
      .enter()
      .append('li')
      .style('background', d => scale.colour(d.layer))
      .text(d => `${d.name} - ${d.level}` || '');

    const layerRect = this.svg
      .append('g')
      .attr('class', 'layers')
      .selectAll('rect')
      .data(data.layers)
      .enter()
      .append('rect')
      .attr('fill', d => scale.colour(d.id))
      .attr('fill-opacity', 0.3)
      .attr('x', 0)
      .attr('width', this.width)
      .attr('height', d => scale.y(d.length))
      .attr('y', d => scale.y(d.y0));

    const link = this.svg
      .append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(data.links)
      .enter()
      .append('path')
      .attr('fill', 'none')
      .attr('stroke-width', 2)
      .attr('stroke', 'rgba(0,0,0,0.15)')
      .attr('d', scale.link);

    const node = this.svg
      .append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(data.nodes)
      .enter()
      .append('circle')
      .attr('r', 15)
      .attr('fill', d => scale.colour(d.layer))
      .attr('title', d => d.name)
      .attr('cx', d => scale.x(d.name))
      .attr('cy', d => scale.y(d.level + 0.5));

    const text = this.svg
      .append('g')
      .attr('class', 'text')
      .selectAll('text')
      .data(data.nodes)
      .enter()
      .append('text')
      .attr('fill', '#fff')
      .attr('text-anchor', 'middle')
      .attr('dy', '5')
      .text(d => d.name)
      .attr('x', d => scale.x(d.name))
      .attr('y', d => scale.y(d.level + 0.5));
  }

  render() {
    return (
      <div className="FlowChart">
        <table id="pathlist" />
        <ul id="nodelist" />
        <svg ref={el => (this._svg = el)} width="960" height="600" />
      </div>
    );
  }
}

export default FlowChart;
