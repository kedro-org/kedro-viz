import React, { Component } from 'react';
import { select } from 'd3-selection';
import { linkVertical, stack } from 'd3-shape';
import {
  scaleLinear,
  scaleOrdinal,
  // scalePoint,
} from 'd3-scale';
import './flowchart.css';

const getArray = n => Array.from(new Array(n)).map((d, i) => i);

const getRandom = (range) => range[Math.floor(Math.random() * range.length)];

const first = arr => arr[0];
const last = arr => arr[arr.length - 1];


class FlowChart extends Component {

  generateRandomData() {
    const layers = getArray(6).map(id => ({ id }));

    const nodes = getArray(30)
      .map((d, i, arr) => ({
        name: d + getRandom('QWERTYUIOPASDFGHJKLZXCVBNM'),
        x: Math.random(),
        layer: getRandom(layers).id,
        // layer: Math.ceil((i / arr.length) * layers.length),
      }));

    const links = nodes.map((d, i) => {
      let source = d;
      let target = getRandom(
        nodes.filter((dd, ii) =>
          dd.name !== source.name && dd.layer >= source.layer
        )
      );
      if (i === nodes.length - 1) {
        return {
          target: source,
          source: target,
        };
      }
      return { source, target };
    });
    
    return {
      layers,
      nodes,
      links,
    };
  }

  /**
   * Experiment
   */
  calculatePaths(data) {

    // Convert each link into a path
    const paths = data.links.map(link => [
      link.source,
      link.target,
    ]);

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
    let totalY = 0;
    data.layers.forEach(layer => {
      // layer.length = paths.map(path =>
      //     path.filter(node => node.layer === layer.id).length
      //   )
      //   .reduce((a, b) => a > b ? a : b, 0);

      // Get the y index for each node, corresponding to its relevant layer
      let layerY = 0;
      paths.forEach((path, i) => {
        let pathY = 0;
        path.forEach(node => {
          if (node.layer === layer.id) {
            node.level = pathY + totalY;
            pathY++;
            if (pathY > layerY) {
              layerY = pathY;
            }
          }
        });
      });
      layer.length = layerY;
      totalY += layerY;
    });
    
    data.yMax = totalY;

    // Add the layer lengths together, to get our maximum length
    // data.yMax = data.layers.reduce((a, b) => a + b.length, 0);
    // console.log(totalY, data.yMax);

    // Calculate start/end of each layer band, for stack viz
    data.layers.reduce((a, b) => {
      b.y0 = a;
      b.y1 = a + b.length;
      return b.y1;
    }, 0);
    
    // const widest = nodes.sort((a, b) => a.level > b.level)
    //   .reduce((a, b) => {
    //     if (b.length > a) {
    //       return b.length;
    //     }
    //     return a;
    //   }, { level: 0, width: 0});
    
    data.paths = paths;
    console.log(data);

    return data;
  }

  makeChart() {
    const svg = select('svg');
    
    let width, height;
    const setChartHeight = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      svg.attr('width', width)
        .attr('height', height);
    };

    setChartHeight();
    // window.addEventListener('resize', setChartHeight);

    // Generate data
    const data = this.generateRandomData();
    this.calculatePaths(data);
  

    // Create scales
    const scale = {
      x: scaleLinear()
        .domain([0, 1])
        .range([0, width]),
  
      y: scaleLinear()
        .domain([0, data.yMax])
        .range([0, height]),
  
      link: linkVertical()
        .x(d => scale.x(d.x))
        .y(d => scale.y(d.level + 0.5)),
  
      colour: scaleOrdinal()
        .domain(data.layers.map(d => d.id))
        .range(data.layers.map((d, i) =>
          `hsl(${i * (360 / data.layers.length)}, 50%, 70%)`
        )),
    };


    // Add objects to the DOM

    // TODO remove this
    select('table')
      .selectAll('tr')
      .data(data.paths)
      .enter()
      .append('tr')
      .selectAll('td')
      .data(d => d)
      .enter()
      .append('td')
      .text(d => `${d.name}-${d.layer}` || '');

    select('ul')
      .selectAll('li')
      .data(data.nodes.sort((a, b) => a.level - b.level))
      .enter()
      .append('li')
      .text(d => `${d.name} - ${d.layer} - ${d.level}` || '');

    const layerRect = svg.append('g')
      .attr('class', 'layers')
      .selectAll('rect')
      .data(data.layers)
      .enter()
      .append('rect')
      .attr('fill', d => scale.colour(d.id))
      .attr('fill-opacity', 0.3)
      .attr('x', 0)
      .attr('width', width)
      .attr('height', d => scale.y(d.length))
      .attr('y', d => scale.y(d.y0));

    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(data.links)
      .enter()
      .append('path')
      .attr('fill', 'none')
      .attr('stroke-width', 2)
      .attr('stroke', 'rgba(0,0,0,0.15)')
      .attr('d', scale.link);

    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(data.nodes)
      .enter()
      .append('circle')
      .attr('r', 15)
      .attr('fill', d => scale.colour(d.layer))
      .attr('title', d => d.name + '-' + d.layer)
      .attr('cx', d => scale.x(d.x))
      .attr('cy', d => scale.y(d.level + 0.5));

    const text = svg.append('g')
      .attr('class', 'text')
      .selectAll('text')
      .data(data.nodes)
      .enter()
      .append('text')
      .attr('fill', '#fff')
      .attr('text-anchor', 'middle')
      .attr('dy', '5')
      .text(d => d.name + '-' + d.layer)
      .attr('x', d => scale.x(d.x))
      .attr('y', d => scale.y(d.level + 0.5));
  }

  componentDidMount() {
    this.makeChart();
  }

  render() {
    return (
      <div className='FlowChart'>
        <table />
        <ul />
        <svg width='960' height='600'></svg>
      </div>
    );
  }
}

export default FlowChart;
