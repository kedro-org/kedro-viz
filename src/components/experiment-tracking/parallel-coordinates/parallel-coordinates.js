import React, { useContext } from 'react';
import classnames from 'classnames';
import { useD3 } from '../../../utils/hooks/use-d3';
import * as d3 from 'd3';
import { HoverStateContext } from '../utils/hover-state-context';

import { LinePath } from './components/line-path.js';

import './parallel-coordinates.css';

// TODO: move them to a cofig file or something
const width = 1500,
  height = 800,
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

  const graph = Object.entries(DATA1.metrics);
  const graphKeys = Object.keys(DATA1.metrics);

  const data = Object.entries(DATA1.runs);
  const selectedData = data.filter(([key, value]) =>
    selectedRuns.includes(key)
  );
  const unSelectedData = data.filter(
    ([key, value]) => !selectedRuns.includes(key)
  );

  const xScale = d3
    .scalePoint()
    .domain(graphKeys)
    .range([paddingLr, width - paddingLr]);

  // Each vertical scale
  const yScales = {};

  // for each metric, you draw a y-scale
  graph.forEach(([key, value]) => {
    yScales[key] = d3
      .scaleLinear()
      .domain([
        Math.floor(Math.min(...value) - Math.min(...value) * buffer),
        Math.ceil(Math.max(...value) + Math.max(...value) * buffer),
      ])
      .range([height - padding, padding]);
  });

  const yAxis = {};
  Object.entries(yScales).forEach(([key, value]) => {
    yAxis[key] = d3.axisLeft(value);
  });

  const lineGenerator = d3.line().defined(function (d) {
    return d !== null;
  });

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

  const ref = useD3(
    (svg) => {
      // const featureAxisG = svg
      //   .selectAll('.feature')
      //   .data(graphKeys)
      //   .enter()
      //   .append('g')
      //   .attr('class', 'feature')
      //   .attr('transform', (d) => 'translate(' + xScale(d) + ',0)');
      // featureAxisG.append('g').each(function (d) {
      //   d3.select(this).call(yAxis[d]);
      // });
      // featureAxisG
      //   .append('text')
      //   .attr('class', 'headers')
      //   .attr('text-anchor', 'middle')
      //   .attr('y', padding / 2)
      //   .text((d) => d);
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
        {graphKeys.map((key) => (
          <g className="feature" transform={`translate(${(xScale(key), 0)})`}>
            <g>{d3.select(this).call(yAxis[key])}</g>
            <text className="headers" textAnchor="middle" y={padding / 2}>
              {key}
            </text>
          </g>
        ))}

        <g className="active">
          {data.map(([id, value], i) => (
            <LinePath
              d={linePath(value, i)}
              id={id}
              isHovered={hoveredElementId === id}
              key={i}
              setHoveredId={setHoveredElementId}
            />
          ))}
        </g>

        <g className="selected">
          {selectedData.map(([id, value], i) => (
            <LinePath
              d={linePath(value, i)}
              id={id}
              isHovered={hoveredElementId === id}
              key={i}
              selected
              stroke={selectedLineColors[i]}
            />
          ))}
        </g>

        {unSelectedData.map(([id, values]) => (
          <g className="ticks" id={id}>
            {values.map((value, i) => (
              <>
                <text
                  className={classnames('text', {
                    'text--hovered': hoveredElementId === id,
                  })}
                  x={xScale(graphKeys[i]) + padding / 2}
                  y={yScales[graphKeys[i]](value)}
                  style={{
                    textAnchor: 'end',
                    transform: 'translate(-10,4)',
                  }}
                >
                  {value}
                </text>
                <line
                  className="line"
                  x1={xScale(graphKeys[i])}
                  y1={yScales[graphKeys[i]](value)}
                  x2={xScale(graphKeys[i]) - 4}
                  y2={yScales[graphKeys[i]](value)}
                ></line>
              </>
            ))}
          </g>
        ))}

        {selectedData.map(([id, values], i) => (
          <g className="marker" id={id}>
            {values.map((value, index) => {
              const transformX = xScale(graphKeys[index]);
              const transformY = yScales[graphKeys[index]](value);
              const rotate = selectedMarkerRotate[i];

              return (
                <>
                  <path
                    d={`${d3.symbol(selectedMarkerShape[i], 20)()}`}
                    transform={`translate(${transformX}, ${transformY}) rotate(${rotate})`}
                    stroke={selectedMarkerColors[i]}
                  ></path>
                  <text
                    className="text"
                    x={xScale(graphKeys[index]) - 5}
                    y={yScales[graphKeys[index]](value)}
                    style={{
                      textAnchor: 'end',
                      transform: 'translate(-10,4)',
                    }}
                  >
                    {value}
                  </text>
                </>
              );
            })}
          </g>
        ))}
      </svg>
    </div>
  );
};
