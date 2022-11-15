import React, { useContext, useState, useEffect } from 'react';
import classnames from 'classnames';
import * as d3 from 'd3';
import { HoverStateContext } from '../utils/hover-state-context';
import { v4 as uuidv4 } from 'uuid';

import { LinePath } from './components/line-path.js';

import './parallel-coordinates.css';

// TODO: move them to a config file or something
const width = 1200,
  height = 800,
  padding = 38,
  paddingLr = 80;

const buffer = 0.05;
const selectedMarkerRotate = [45, 0, 0];

const selectedMarkerColors = ['#00E3FF', '#3BFF95', '#FFE300'];
const selectedLineColors = ['#00BCFF', '#31E27B', '#FFBC00'];

const yAxis = {};

export const ParallelCoordinates = ({ DATA, selectedRuns }) => {
  const [hoveredAxisG, setHoveredAxisG] = useState(null);

  const { hoveredElementId, setHoveredElementId } =
    useContext(HoverStateContext);

  const selectedMarkerShape = [
    d3.symbolSquare,
    d3.symbolTriangle,
    d3.symbolCircle,
  ];

  const graph = Object.entries(DATA.metrics);
  const graphKeys = Object.keys(DATA.metrics);

  const data = Object.entries(DATA.runs);
  const selectedData = data.filter(([key, value]) =>
    selectedRuns.includes(key)
  );
  const selectedValues = [];
  selectedData.map(([id, values]) => {
    return values.map((value) => selectedValues.push(value));
  });

  const hoveredValues = hoveredElementId && DATA.runs[hoveredElementId];

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
      .range([height - padding - padding / 2, padding + padding / 3]);
  });

  Object.entries(yScales).forEach(([key, value]) => {
    yAxis[key] = d3.axisLeft(value).tickSizeOuter(0);
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

  const handleMouseOverMetric = (e, key) => {
    setHoveredAxisG(key);
  };

  const handleMouseOutMetric = () => {
    setHoveredAxisG(null);
  };

  useEffect(() => {
    const axisG = d3.selectAll('.feature');

    if (axisG) {
      axisG.append('g').each(function (each, index) {
        const key = graphKeys[index];
        d3.select(this).call(yAxis[key]);
      });
    }
  }, [graphKeys]);

  return (
    <div className="parallel-coordinates">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
        {graph.map(([id, values]) => {
          // To avoid rendering the tick more than 1
          const uniqueValues = values.filter(
            (value, i, self) => self.indexOf(value) === i
          );

          return (
            <g className="ticks" id={id} key={`ticks--${id}`}>
              {uniqueValues.map((value) => {
                const active =
                  hoveredAxisG === id ||
                  (hoveredValues && hoveredValues.includes(value));

                // Don't render the tick if its from the selected runs
                if (!selectedValues.includes(value)) {
                  return (
                    <React.Fragment key={uuidv4()}>
                      <text
                        className={classnames('text', {
                          'text--hovered': active,
                        })}
                        key={`ticks-text--${id}`}
                        x={xScale(id) - 8}
                        y={yScales[id](value) + 3}
                        style={{
                          textAnchor: 'end',
                          transform: 'translate(-10,4)',
                        }}
                      >
                        {value}
                      </text>
                      <line
                        className={classnames('line', {
                          'line--hovered': active,
                        })}
                        key={`ticks-line--${id}`}
                        x1={xScale(id)}
                        x2={xScale(id) - 4}
                        y1={yScales[id](value)}
                        y2={yScales[id](value)}
                      ></line>
                    </React.Fragment>
                  );
                } else {
                  return null;
                }
              })}
            </g>
          );
        })}

        {graphKeys.map((key) => (
          <g
            className={classnames('feature', {
              'feature--hovered': hoveredAxisG === key,
            })}
            transform={`translate(${xScale(key)}, 0)`}
            y={padding / 2}
            key={`feature--${key}`}
          >
            <text
              className="headers"
              textAnchor="middle"
              y={padding / 2}
              onMouseOver={(e) => handleMouseOverMetric(e, key)}
              onMouseOut={handleMouseOutMetric}
              key={`feature-text--${key}`}
            >
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
              key={id}
              setHoveredId={setHoveredElementId}
              value={value}
            />
          ))}
        </g>

        <g className="selected">
          {selectedData.map(([id, value], i) => (
            <LinePath
              d={linePath(value, i)}
              id={id}
              isHovered={hoveredElementId === id}
              key={id}
              selected
              stroke={selectedLineColors[i]}
            />
          ))}
        </g>

        {selectedData.map(([id, values], i) => (
          <g className="marker" id={id} key={`marker--${id}`}>
            {values.map((value, index) => {
              const transformX = xScale(graphKeys[index]);
              const transformY = yScales[graphKeys[index]](value);
              const rotate = selectedMarkerRotate[i];

              return (
                <React.Fragment key={uuidv4()}>
                  <path
                    d={`${d3.symbol(selectedMarkerShape[i], 20)()}`}
                    key={`marker-path--${index}`}
                    stroke={selectedMarkerColors[i]}
                    transform={`translate(${transformX}, ${transformY}) rotate(${rotate})`}
                  />
                  <text
                    className="text"
                    key={`marker-text--${index}`}
                    x={xScale(graphKeys[index]) - 10}
                    y={yScales[graphKeys[index]](value)}
                    style={{
                      textAnchor: 'end',
                      transform: 'translate(-10,4)',
                    }}
                  >
                    {value}
                  </text>
                </React.Fragment>
              );
            })}
          </g>
        ))}
      </svg>
    </div>
  );
};
