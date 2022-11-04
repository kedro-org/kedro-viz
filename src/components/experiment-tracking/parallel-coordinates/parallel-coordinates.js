/* eslint-disable id-length */
import React, { useContext } from 'react';
import { useD3 } from '../../../utils/hooks/use-d3';
import * as d3 from 'd3';
import { HoverStateContext } from '../utils/hover-state-context';

import { LinePath } from './components/line-path.js';

import './parallel-coordinates.css';

const width = 1800,
  height = 1200,
  padding = 38,
  paddingLr = 50;

const buffer = 0.05;
const selectedMarkerRotate = [45, 0, 0];

const selectedMarkerColors = ['#00E3FF', '#3BFF95', '#FFE300'];
const selectedLineColors = ['#00BCFF', '#31E27B', '#FFBC00'];

export const ParallelCoordinates = ({ DATA1, selectedRuns }) => {
  const { hoveredElementId, setHoveredElementId } =
    useContext(HoverStateContext);

  const selectedMarkerShape = [
    d3.symbolSquare,
    d3.symbolTriangle,
    d3.symbolCircle,
  ];

  //data manipulation
  const graph = Object.entries(DATA1.metrics);
  const graphKeys = Object.keys(DATA1.metrics);

  const data = Object.entries(DATA1.runs);
  const selectedData = data.filter(([key, value]) =>
    selectedRuns.includes(key)
  );

  const xScale = d3
    .scalePoint()
    .domain(graphKeys)
    .range([paddingLr, width - paddingLr]);

  // Each vertical scale
  const yScales = {};

  // for each metric, you draw a y-scale
  graph.map(([k, v]) => {
    yScales[k] = d3
      .scaleLinear()
      .domain([
        Math.floor(Math.min(...v) - Math.min(...v) * buffer),
        Math.ceil(Math.max(...v) + Math.max(...v) * buffer),
      ])
      .range([height - padding, padding]);
  });

  // Each axis generator
  const yAxis = {};

  Object.entries(yScales).map((x) => {
    yAxis[x[0]] = d3.axisLeft(x[1]);
  });

  const lineGenerator = d3.line().defined(function (d) {
    return d !== null;
  });

  // Paths for data
  const linePath = function (d) {
    let points = d.map((x, i) => {
      if (x !== null) {
        return [xScale(graphKeys[i]), yScales[graphKeys[i]](x)];
      } else {
        return null;
      }
    });
    return lineGenerator(points);
  };

  // Paths for data (selected runs)
  const lineSelectedPath = function (d) {
    let points = d.map((x, i) => {
      if (x !== null) {
        return [xScale(graphKeys[i]), yScales[graphKeys[i]](x)];
      } else {
        return null;
      }
    });
    return lineGenerator(points);
  };

  const ref = useD3(
    (svg) => {
      const featureAxisG = svg
        .selectAll('.feature')
        .data(graphKeys)
        .enter()
        .append('g')
        .attr('class', 'feature')
        .attr('transform', (d) => 'translate(' + xScale(d) + ',0)');

      featureAxisG.append('g').each(function (d) {
        d3.select(this).call(yAxis[d]);
      });

      featureAxisG
        .append('text')
        .attr('class', 'headers')
        .attr('text-anchor', 'middle')
        .attr('y', padding / 2)
        .text((d) => d);

      let ticks = svg
        .selectAll('.ticks')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'ticks')
        .attr('id', ([k, v]) => k);

      // //ticks for the chart
      ticks.each(function (d) {
        const [key, values] = d;
        for (const [index, value] of values.entries()) {
          if (value !== null) {
            d3.select(this)
              .append('text')
              .attr('class', 'text')
              .attr('x', xScale(graphKeys[index]))
              .attr('y', yScales[graphKeys[index]](value))
              .text(value)
              .attr('text-anchor', 'end')
              .attr('transform', 'translate(-10,4)');

            d3.select(this)
              .append('line')
              .attr('class', 'line')
              .attr('x1', xScale(graphKeys[index]))
              .attr('y1', yScales[graphKeys[index]](value))
              .attr('x2', xScale(graphKeys[index]) - 4)
              .attr('y2', yScales[graphKeys[index]](value));
          }
        }
      });

      //markers for selected runs
      let marker = svg
        .selectAll('.marker')
        .data(selectedData)
        .enter()
        .append('g')
        .attr('class', 'marker')
        .attr('id', ([k, v]) => k);

      marker.each(function (d, i) {
        const [key, values] = d;
        for (const [index, value] of values.entries()) {
          if (value !== null) {
            d3.select(this)
              .append('path')
              .attr('d', d3.symbol().type(selectedMarkerShape[i]).size(25))
              .attr(
                'transform',
                'translate(' +
                  xScale(graphKeys[index]) +
                  ',' +
                  yScales[graphKeys[index]](value) +
                  ') rotate(' +
                  selectedMarkerRotate[i] +
                  ')'
              )
              .attr('stroke', selectedMarkerColors[i]);

            d3.select(this)
              .append('text')
              .attr('class', 'text')
              .attr('x', xScale(graphKeys[index]))
              .attr('y', yScales[graphKeys[index]](value))
              .text(value)
              .attr('text-anchor', 'end')
              .attr('transform', 'translate(-10,4)');
          }
        }
      });
    },
    [data.length]
  );

  return (
    <div className="parallelCoordinates">
      <svg
        ref={ref}
        style={{
          height,
          width,
        }}
      >
        <g className="active">
          {data.map(([id, v], i) => (
            <LinePath
              d={linePath(v, i)}
              id={id}
              isHovered={hoveredElementId === id}
              key={i}
              setHoveredId={setHoveredElementId}
            />
          ))}
        </g>
        <g className="selected">
          {selectedData.map(([id, v], i) => (
            <LinePath
              d={lineSelectedPath(v, i)}
              fill={'none'}
              id={id}
              isHovered={hoveredElementId === id}
              key={i}
              selected
              stroke={selectedLineColors[i]}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};
