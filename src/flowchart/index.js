import React, { Component } from 'react';
// import {
//   forceSimulation,
//   forceManyBody,
//   forceCenter,
//   forceX,
//   forceLink,
// } from 'd3-force';
import { select } from 'd3-selection';
import { linkVertical } from 'd3-shape';
import { scaleBand, scaleLinear } from 'd3-scale';
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

    const bands_data = getArray(6);

    const nodes_data = getArray(30)
      .map(d => ({
        name: d + getRandom('QWERTYUIOPASDFGHJKLZXCVBNM'),
        x: Math.random(),
        sex: getRandom('MF'),
        level: getRandom(bands_data),
      }));
      
    const links_data = getArray(20)
      .map((d, i) => {
        const source = getRandom(nodes_data);
        const target = getRandom(
          nodes_data.filter((dd, ii) =>
            dd.name !== source.name && dd.level >= source.level
          )
        );
        return { source, target };
      });

    const xScale = scaleLinear()
      .domain([0, 1])
      .range([0, width]);
    // const xScale = forceX()
    //   .x(d => d.name);

    const bandScale = scaleBand()
      .domain(bands_data)
      .range([0, height]);

    const yScale = scaleBand()
      .domain(nodes_data.map(d => d.name))
      .range([0, height]);

    const linkShape = linkVertical()
      .x(d => xScale(d.x))
      .y(d => yScale(d.name));

    // const simulation = forceSimulation()
    //   .nodes(nodes_data);

    // add a charge to each node and a centering force
    // simulation
    //   .force('charge_force', forceManyBody())
    //   .force('center_force', forceCenter(width / 2, height / 2));


    const bandRect = svg.append('g')
      .attr('class', 'bands')
      .selectAll('rect')
      .data(bands_data)
      .enter()
      .append('rect')
      .attr('fill', (d, i) => `hsl(${i * 50}, 70%, 90%)`)
      .attr('x', 0)
      .attr('width', width)
      .attr('height', bandScale.bandwidth())
      .attr('y', d => bandScale(d));

      
    // add tick instructions: 
    // simulation.on('tick', tickActions);

    
    // Create the link force 
    // We need the id accessor to use named sources and targets 
    // const link_force = forceLink(links_data)
    //   .id(function (d) { return d.name; })

    // //Add a links force to the simulation
    // //Specify links in d3.forceLink argument
    // simulation.force('links', link_force)

    // draw lines for the links 
    // const link = svg.append('g')
    //   .attr('class', 'links')
    //   .selectAll('line')
    //   .data(links_data)
    //   .enter()
    //   .append('line')
    //   .attr('stroke-width', 2)
    //   .attr('stroke', 'steelblue')
    //   .attr('x1', d => xScale(d.source.x))
    //   .attr('y1', d => yScale(d.source.name))
    //   .attr('x2', d => xScale(d.target.x))
    //   .attr('y2', d => yScale(d.target.name));

    // draw lines for the links 
    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(links_data)
      .enter()
      .append('path')
      .attr('fill', 'none')
      .attr('stroke-width', 2)
      .attr('stroke', '#aaa')
      .attr('d', linkShape);

    // draw circles for the nodes 
    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodes_data)
      .enter()
      .append('circle')
      .attr('r', 10)
      .attr('fill', 'tomato')
      .attr('title', d => d.name)
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.name));

    // function tickActions() {
    //   console.log(node.data());
    //   //update circle positions each tick of the simulation 
    //   node
    //     .attr('cx', function (d) { return d.x; })
    //     .attr('cy', function (d) { return d.y; });

    //   //update link positions 
    //   //simply tells one end of the line to follow one node around
    //   //and the other end of the line to follow the other node around
    //   link
    //     .attr('x1', function (d) { return d.source.x; })
    //     .attr('y1', function (d) { return d.source.y; })
    //     .attr('x2', function (d) { return d.target.x; })
    //     .attr('y2', function (d) { return d.target.y; });
    // }
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
