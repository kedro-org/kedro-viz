import React, { Component } from 'react';
import {
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceY,
  forceLink,
} from 'd3-force';
import { select } from 'd3-selection';
import { linkVertical } from 'd3-shape';
import {
  scaleBand,
  scaleLinear,
  scaleOrdinal,
  scalePoint,
} from 'd3-scale';
import './flowchart.css';

const getArray = n => Array.from(new Array(n)).map((d, i) => i);

const getRandom = (range) => range[Math.floor(Math.random() * range.length)];


class FlowChart extends Component {
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

    const bands_data = getArray(6);

    const nodes_data = getArray(30)
      .map(d => ({
        name: d + getRandom('QWERTYUIOPASDFGHJKLZXCVBNM'),
        x: Math.random(),
        sex: getRandom('MF'),
        level: getRandom(bands_data),
      }));
      
    const links_data = getArray(30)
      .map((d, i) => {
        const source = getRandom(nodes_data);
        const target = getRandom(
          nodes_data.filter((dd, ii) =>
            dd.name !== source.name && dd.level >= source.level
          )
        );
        return { source, target };
      });


    // Create scales
    const scale = {
      x: scaleLinear()
        .domain([0, 1])
        .range([0, width]),
  
      y: scalePoint()
        .padding(0.5)
        .domain(bands_data)
        .range([0, height]),
  
      link: linkVertical()
        .x(d => d.x)
        .y(d => d.y),
        // .x(d => scale.x(d.x))
        // .y(d => scale.y(d.name)),
  
      band: scaleBand()
        .domain(bands_data)
        .range([0, height]),
  
      colour: scaleOrdinal()
        .domain(bands_data)
        .range(bands_data.map((d, i) =>
          `hsl(${i * (360 / bands_data.length)}, 50%, 50%)`
        )),
    };

    
    // Init force

    const simulation = forceSimulation()
      .nodes(nodes_data);

    // add a charge to each node and a centering force
    simulation
      .force('y', forceY().y(d => scale.y(d.level)))
      .force('charge_force', forceManyBody())
      .force('center_force', forceCenter(width / 2, height / 2));
      
    // add tick instructions: 
    simulation.on('tick', tickActions);

    // Create the link force 
    // We need the id accessor to use named sources and targets 
    const link_force = forceLink(links_data)
      .id(function (d) { return d.name; })
      .strength(() => 0.001);

    // Add a links force to the simulation
    // Specify links in d3.forceLink argument
    simulation.force('links', link_force);


    // Add objects to the DOM

    const bandRect = svg.append('g')
      .attr('class', 'bands')
      .selectAll('rect')
      .data(bands_data)
      .enter()
      .append('rect')
      .attr('fill', d => scale.colour(d))
      .attr('fill-opacity', 0.4)
      .attr('x', 0)
      .attr('width', width)
      .attr('height', scale.band.bandwidth())
      .attr('y', d => scale.band(d));

    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(links_data)
      .enter()
      .append('path')
      .attr('fill', 'none')
      .attr('stroke-width', 2)
      .attr('stroke', '#aaa');

    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodes_data)
      .enter()
      .append('circle')
      .attr('r', 10)
      .attr('fill', 'tomato')
      .attr('fill', d => scale.colour(d.level))
      .attr('title', d => d.name + '-' + d.level);

    function tickActions() {
      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
        // .attr('cx', d => scale.x(d.x))
        // .attr('cy', d => scale.y(d.level));

      link.attr('d', scale.link);
      console.log(nodes_data);
    }
  }

  componentDidMount() {
    this.makeChart();
  }

  render() {
    return (
      <div className='FlowChart'>
        <svg width='960' height='600'></svg>
      </div>
    );
  }
}

export default FlowChart;
