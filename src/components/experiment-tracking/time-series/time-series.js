import React, { useContext, useState } from 'react';
import classnames from 'classnames';
import { formatTimestamp } from '../../../utils/date-utils';
import { HoverStateContext } from '../utils/hover-state-context';
import * as d3 from 'd3';

import './time-series.css';

// TODO: move them to a config file or something

const margin = { top: 50, right: 0, bottom: 50, left: 30 };
const width = 786,
  height = 150;

const selectedMarkerRotate = [45, 0, 0];

const selectedMarkerShape = [
  d3.symbolSquare,
  d3.symbolTriangle,
  d3.symbolCircle,
];

// const yAxis = {};

export const TimeSeries = ({ metricsData, selectedRuns }) => {
  const { hoveredElementId, setHoveredElementId } =
    useContext(HoverStateContext);

  const [hoveredMouseELementId, setHoveredMouseELementId] = useState(null);

  const hoveredElementDate =
    (hoveredElementId && new Date(formatTimestamp(hoveredElementId))) ||
    (hoveredMouseELementId && new Date(formatTimestamp(hoveredMouseELementId)));

  const hoveredValues =
    (hoveredElementId && metricsData.runs[hoveredElementId]) ||
    (hoveredMouseELementId && metricsData.runs[hoveredMouseELementId]);

  const metricKeys = Object.keys(metricsData.metrics);
  const runData = Object.entries(metricsData.runs);
  const runKeys = Object.keys(metricsData.runs);
  const metricData = Object.entries(metricsData.metrics);

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
    ([_, value], i) =>
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
        const metricValues = Object.values(metricsData.metrics)[metricIndex];

        const getXAxis = (ref) => {
          d3.select(ref).call(d3.axisBottom(xScale).tickSizeOuter(0));
        };

        const getYAxis = (ref) => {
          d3.select(ref).call(
            d3.axisLeft(yScales[metricIndex]).tickSizeOuter(0)
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
          <>
            <div className="metric-name">{metricName}</div>
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
                  className="x-axis"
                  ref={getXAxis}
                  transform={`translate(0,${height})`}
                />

                <g className="y-axis" ref={getYAxis} />

                <g
                  className="y-axis-right"
                  ref={getYAxis}
                  transform={`translate(${width},0)`}
                />

                <text
                  className="axis-label"
                  y={10 - margin.left}
                  x={-10 - height / 2}
                >
                  value
                </text>

                <g
                  className={classnames('run-line', {
                    'run-line--blend':
                      hoveredElementId || selectedRuns.length > 1,
                  })}
                >
                  <path d={linePath(metricValues)} />
                </g>

                <g className="reference-group">
                  {parsedData.map(([key, _], index) => (
                    <line
                      className={classnames('reference-line', {
                        'reference-line--hovered':
                          hoveredMouseELementId === runKeys[index],
                      })}
                      x1={xScale(key)}
                      y1={0}
                      x2={xScale(key)}
                      y2={height}
                      onMouseOver={(e) =>
                        setHoveredMouseELementId(runKeys[index])
                      }
                      onMouseLeave={() => setHoveredMouseELementId(null)}
                    />
                  ))}
                </g>

                {hoveredValues && (
                  <g>
                    {hoveredValues.map((value, index) => {
                      if (metricIndex === index) {
                        return (
                          <>
                            <line
                              className="hovered-line"
                              x1={0}
                              y1={yScales[index](value)}
                              x2={width}
                              y2={yScales[index](value)}
                            />
                            <line
                              className="reference-line--hovered"
                              x1={xScale(hoveredElementDate)}
                              y1={0}
                              x2={xScale(hoveredElementDate)}
                              y2={height}
                              onMouseOver={(e) => {
                                setHoveredElementId(runKeys[index]);
                              }}
                              onMouseOut={() => setHoveredElementId(null)}
                            />
                            <g className="ticks">
                              <line
                                className="tick-line"
                                x1={xScale(hoveredElementDate)}
                                y1={yScales[index](value)}
                                x2={xScale(hoveredElementDate) - 5}
                                y2={yScales[index](value)}
                              />
                              <text
                                className="tick-text"
                                x={xScale(hoveredElementDate)}
                                y={yScales[index](value)}
                              >
                                {value.toFixed(3)}
                              </text>
                            </g>
                          </>
                        );
                      } else {
                        return null;
                      }
                    })}
                    ;
                  </g>
                )}

                <g className="selected">
                  {selectedData.map(([key, value], index) => (
                    <>
                      <line
                        className={`selected-line--${index}`}
                        x1={xScale(key)}
                        y1={0}
                        x2={xScale(key)}
                        y2={height}
                      />
                      <text
                        className="tick-text"
                        x={xScale(key)}
                        y={yScales[metricIndex](value[metricIndex])}
                      >
                        {value[metricIndex].toFixed(3)}
                      </text>
                      <path
                        className={`selected-marker--${index}`}
                        d={`${d3.symbol(selectedMarkerShape[index], 20)()}`}
                        transform={`translate(${xScale(key)},${yScales[
                          metricIndex
                        ](value[metricIndex])}) 
                  rotate(${selectedMarkerRotate[index]})`}
                      />
                    </>
                  ))}
                </g>

                <g className="dotted-line">
                  <path d={dottedLinePath(selectedData)} />
                </g>
              </g>
            </svg>
          </>
        );
      })}
    </div>
  );
};
