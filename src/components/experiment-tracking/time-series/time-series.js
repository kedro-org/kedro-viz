import React, { useContext, useEffect, useState } from 'react';
import classnames from 'classnames';
import { formatTimestamp } from '../../../utils/date-utils';
import { HoverStateContext } from '../utils/hover-state-context';
import * as d3 from 'd3';

import './time-series.css';

export const TimeSeries = ({ metricsData, selectedRuns }) => {
  const [width, setWidth] = useState(0);
  const { hoveredElementId, setHoveredElementId } =
    useContext(HoverStateContext);

  const margin = { top: 20, right: 0, bottom: 80, left: 40 };
  const height = 150;
  const chartBuffer = 0.02;

  const selectedMarkerRotate = [45, 0, 0];
  const selectedMarkerShape = [
    d3.symbolSquare,
    d3.symbolTriangle,
    d3.symbolCircle,
  ];

  const hoveredElementDate =
    hoveredElementId && new Date(formatTimestamp(hoveredElementId));

  const hoveredValues = hoveredElementId && metricsData.runs[hoveredElementId];

  const metricKeys = Object.keys(metricsData.metrics);
  const metricData = Object.entries(metricsData.metrics);
  const runKeys = Object.keys(metricsData.runs);
  const runData = Object.entries(metricsData.runs);

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
  minDate.setDate(minDate.getDate() - diffDays * chartBuffer);
  const maxDate = new Date(d3.max(parsedDates));
  maxDate.setDate(maxDate.getDate() + diffDays * chartBuffer);

  const selectedData = runData
    .filter(([key, value]) => selectedRuns.includes(key))
    .map(([key, value], i) => [new Date(formatTimestamp(key)), value]);

  const yScales = {};

  metricData.map(
    ([_, value], i) =>
      (yScales[i] = d3
        .scaleLinear()
        .domain([
          Math.min(...value) - Math.min(...value) * chartBuffer,
          Math.max(...value) + Math.max(...value) * chartBuffer,
        ])
        .range([height, 0]))
  );

  const xScale = d3.scaleTime().domain([minDate, maxDate]).range([0, width]);

  useEffect(() => {
    d3.selectAll(`line[id="${hoveredElementId}"]`).raise();
  }, [hoveredElementId]);

  useEffect(() => {
    setWidth(
      document.querySelector('.metrics-plots-wrapper__charts').clientWidth - 100
    );
  }, []);

  return (
    <div className="time-series">
      {metricKeys.map((metricName, metricIndex) => {
        const metricValues = Object.values(metricsData.metrics)[metricIndex];

        const getXAxis = (ref) => {
          d3.select(ref).call(d3.axisBottom(xScale).tickSizeOuter(0));
        };

        const getYAxis = (ref) => {
          d3.select(ref).call(
            d3
              .axisLeft(yScales[metricIndex])
              .tickSizeOuter(0)
              .tickFormat((x) => `${x.toFixed(2)}`)
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

        const trendLinePath = function (data) {
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
            <div
              className="timeseries-metric-name"
              key={`timeseries-metric-name--${metricName}`}
            >
              {metricName}
            </div>
            <svg
              preserveAspectRatio="xMinYMin meet"
              key={`timeseries--${metricName}`}
              width={width + margin.left + margin.right}
              height={height + margin.top + margin.bottom}
            >
              <g
                id={metricName}
                key={metricName}
                transform={`translate(${margin.left},${margin.top})`}
              >
                <g
                  className="timeseries-runs-axis"
                  key={`timeseries-runs-axis--${metricName}`}
                  ref={getXAxis}
                  transform={`translate(0,${height})`}
                />

                <g
                  className="timeseries-metric-axis"
                  key={`timeseries-metric-axis--${metricName}`}
                  ref={getYAxis}
                />

                <g
                  className="timeseries-metric-axis-dual"
                  key={`timeseries-metric-axis-dual--${metricName}`}
                  ref={getYAxis}
                  transform={`translate(${width},0)`}
                />

                <text
                  className="timeseries-axis-label"
                  key={`timeseries-axis-label--${metricName}`}
                  y={10 - margin.left}
                  x={-10 - height / 2}
                >
                  value
                </text>

                <g
                  className="timeseries-run-lines"
                  key={`timeseries-run-lines--${metricName}`}
                >
                  {parsedData.map(([key, _], index) => (
                    <line
                      className={classnames('timeseries-run-line', {
                        'timeseries-run-line--hovered':
                          hoveredElementId === runKeys[index],
                      })}
                      id={runKeys[index]}
                      key={`timeseries-runs-line--${metricName}--${key}`}
                      x1={xScale(key)}
                      y1={0}
                      x2={xScale(key)}
                      y2={height}
                      onMouseOver={(e) => setHoveredElementId(runKeys[index])}
                      onMouseLeave={() => setHoveredElementId(null)}
                    />
                  ))}
                </g>

                {hoveredValues && (
                  <g
                    className="timeseries-hovered-line-group"
                    key={`timeseries-hovered-line-group--${metricName}`}
                  >
                    {hoveredValues.map((value, index) => {
                      if (metricIndex === index) {
                        return (
                          <>
                            <line
                              className="timeseries-hovered-line"
                              key={`timeseries-hovered-line--${metricName}--${value}`}
                              x1={0}
                              y1={yScales[index](value)}
                              x2={width}
                              y2={yScales[index](value)}
                            />
                            <g
                              className="timeseries-ticks"
                              key={`timeseries-ticks--${metricName}--${value}`}
                            >
                              <line
                                className="timeseries-tick-line"
                                key={`timeseries-tick-line--${metricName}--${value}`}
                                x1={xScale(hoveredElementDate)}
                                y1={yScales[index](value)}
                                x2={xScale(hoveredElementDate) - 5}
                                y2={yScales[index](value)}
                              />
                              <text
                                className="timeseries-tick-text"
                                key={`timeseries-tick-text--${metricName}--${value}`}
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

                <g
                  className="timeseries-selected-group"
                  key={`timeseries-selected-group--${metricName}}`}
                >
                  {selectedData.map(([key, value], index) => (
                    <>
                      <line
                        className={`timeseries-selected-line--${index}`}
                        key={`timeseries-selected-line--${metricName}--${key}`}
                        x1={xScale(key)}
                        y1={0}
                        x2={xScale(key)}
                        y2={height}
                      />
                      <text
                        className="timeseries-tick-text"
                        key={`timeseries-tick-text--${metricName}--${key}`}
                        x={xScale(key)}
                        y={yScales[metricIndex](value[metricIndex])}
                      >
                        {value[metricIndex].toFixed(3)}
                      </text>
                      <path
                        className={`timeseries-selected-marker--${index}`}
                        key={`timeseries-selected-marker--${metricName}--${key}`}
                        d={`${d3.symbol(selectedMarkerShape[index], 20)()}`}
                        transform={`translate(${xScale(key)},${yScales[
                          metricIndex
                        ](value[metricIndex])}) 
                  rotate(${selectedMarkerRotate[index]})`}
                      />
                    </>
                  ))}
                </g>

                <g
                  className={classnames('timeseries-metric-line', {
                    'timeseries-metric-line--blend':
                      hoveredElementId || selectedRuns.length > 1,
                  })}
                  key={`timeseries-metric-line--${metricName}`}
                >
                  <path d={linePath(metricValues)} />
                </g>

                <g
                  className="timeseries-trend-line"
                  key={`timeseries-trend-line--${metricName}`}
                >
                  <path
                    key={`timeseries-trend-line-path--${metricName}`}
                    d={trendLinePath(selectedData)}
                  />
                </g>
              </g>
            </svg>
          </>
        );
      })}
    </div>
  );
};
