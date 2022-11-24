import React, { useState } from 'react';
import { formatTimestamp } from '../../../utils/date-utils';
import * as d3 from 'd3';

// TODO: move them to a config file or something

const margin = { top: 50, right: 0, bottom: 50, left: 50 };
const width = 760,
  height = 150;

const selectedMarkerColors = ['#00E3FF', '#3BFF95', '#FFE300'];

const selectedLineColors = ['#00BCFF', '#31E27B', '#FFBC00'];

const selectedMarkerRotate = [45, 0, 0];

const selectedMarkerShape = [
  d3.symbolSquare,
  d3.symbolTriangle,
  d3.symbolCircle,
];

// const yAxis = {};

export const TimeSeries = ({ DATA, selectedRuns }) => {
  const [hoveredReference, setHoveredReference] = useState(null);
  const metricKeys = Object.keys(DATA.metrics);

  const runData = Object.entries(DATA.runs);

  const metricData = Object.entries(DATA.metrics);

  const parsedData = runData.map(([key, value]) => [
    new Date(formatTimestamp(key)),
    value,
  ]);

  const parsedDates = parsedData.map(([key, _]) => key);

  const diffDays = parseInt(
    (d3.max(parsedDates) - d3.min(parsedDates)) / (1000 * 60 * 60 * 24),
    10
  );

  const minDate = new Date(d3.min(parsedDates));
  minDate.setDate(minDate.getDate() - diffDays * 0.02);

  const maxDate = new Date(d3.max(parsedDates));
  maxDate.setDate(maxDate.getDate() + diffDays * 0.02);

  const selectedData = runData
    .filter(([key, value]) => selectedRuns.includes(key))
    .map(([key, value], i) => [new Date(formatTimestamp(key)), value]);

  // Each vertical scale

  const yScales = {};

  metricData.map(
    ([key, value], i) =>
      (yScales[i] = d3
        .scaleLinear()
        .domain([
          Math.floor(Math.min(...value) - Math.min(...value) * 0.02),
          Math.ceil(Math.max(...value) + Math.max(...value) * 0.02),
        ])
        .range([height, 0]))
  );

  const xScale = d3.scaleTime().domain([minDate, maxDate]).range([0, width]);

  return (
    <div className="time-series">
      {metricKeys.map((metricName, metricIndex) => {
        const metricValues = Object.values(DATA.metrics)[metricIndex];

        const getXAxis = (ref) => {
          d3.select(ref).call(d3.axisBottom(xScale).tickSizeOuter(0));
        };

        const getYAxis = (ref) => {
          d3.select(ref).call(
            d3
              .axisLeft(yScales[metricIndex])
              .tickValues(metricValues)
              .tickSizeOuter(0)
          );
        };

        const linePath = function (data) {
          let points = data.map((x, i) => {
            if (x !== null) {
              return [xScale(parsedDates[i]), yScales[metricIndex](x)];
            } else {
              return null;
            }
          });
          return d3.line()(points);
        };

        const dottedLinePath = function (data) {
          let points = data.map(([key, value]) => {
            if (value !== null) {
              return [xScale(key), yScales[metricIndex](value[metricIndex])];
            } else {
              return null;
            }
          });
          return d3.line()(points);
        };

        return (
          <svg
            preserveAspectRatio="xMinYMin meet"
            width={width + margin.left + margin.right}
            height={height + margin.top + margin.bottom}
          >
            <g
              id={metricName}
              transform={`translate(${margin.left},${margin.top})`}
            >
              <g
                className="xAxis"
                ref={getXAxis}
                transform={`translate(0,${height})`}
              />
              <g className="yAxis" ref={getYAxis} />
              <g className="runLine">
                <path d={linePath(metricValues)} fill="none" stroke="#717D84" />
                )
              </g>
              <g className="referenceLine">
                {parsedData.map(([key, value]) => (
                  <line
                    x1={xScale(key)}
                    y1={0}
                    x2={xScale(key)}
                    y2={height}
                    stroke="#21333E"
                    onMouseOver={() => {
                      setHoveredReference(value);
                    }}
                    onMouseLeave={() => setHoveredReference(null)}
                  />
                ))}
              </g>
              <g className="selected">
                {selectedData.map(([key, _], index) => (
                  <line
                    x1={xScale(key)}
                    y1={0}
                    x2={xScale(key)}
                    y2={height}
                    stroke={selectedLineColors[index]}
                  />
                ))}
              </g>
              <g className="marker">
                {selectedData.map(([key, value], index) => (
                  <path
                    d={`${d3.symbol(selectedMarkerShape[index], 20)()}`}
                    transform={`translate(${xScale(key)},${yScales[metricIndex](
                      value[metricIndex]
                    )}) 
                  rotate(${selectedMarkerRotate[index]})`}
                    stroke={selectedMarkerColors[index]}
                  />
                ))}
              </g>

              <g className="dotted-line">
                <path
                  d={dottedLinePath(selectedData)}
                  fill="none"
                  stroke="white"
                  strokeDasharray={4}
                />
              </g>

              {hoveredReference && (
                <g className="hovered-line">
                  {hoveredReference.map((value, index) => {
                    if (metricIndex === index) {
                      return (
                        <line
                          x1={0}
                          y1={yScales[index](value)}
                          x2={width}
                          y2={yScales[index](value)}
                          stroke="#97A0A6"
                          strokeDasharray={4}
                        />
                      );
                    }
                  })}
                  ;
                </g>
              )}
            </g>
          </svg>
        );
      })}
    </div>
  );
};
