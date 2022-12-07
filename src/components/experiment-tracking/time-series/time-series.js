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
  const [rangeSelection, setRangeSelection] = useState();

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
    .filter(([key, _]) => selectedRuns.includes(key))
    .map(([key, value], i) => [new Date(formatTimestamp(key)), value]);

  const selectedOrderedData = runData
    .filter(([key, _]) => selectedRuns.includes(key))
    .sort((a, b) => {
      // We need to sort the selected data to match the order of selectedRuns.
      // If we didn't, the highlighted runs would switch colors unnecessarily.
      return selectedRuns.indexOf(a[0]) - selectedRuns.indexOf(b[0]);
    })
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

  // if (currentZoomState) {
  //   xScale.domain(currentZoomState);
  // }

  if (rangeSelection) {
    xScale.domain(rangeSelection);
  }
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
          if (rangeSelection) {
            d3.select(ref)
              .transition()
              .duration(1000)
              .call(d3.axisBottom(xScale).tickSizeOuter(0));
          } else {
            d3.select(ref).call(d3.axisBottom(xScale).tickSizeOuter(0));
          }
        };

        const getYAxis = (ref) => {
          d3.select(ref).call(
            d3
              .axisLeft(yScales[metricIndex])
              .tickSizeOuter(0)
              .tickFormat((x) => `${x.toFixed(2)}`)
          );
        };

        const linePath = (data) => {
          let points = data.map((x, i) => {
            if (x !== null) {
              return [xScale(parsedDates[i]), yScales[metricIndex](x)];
            } else {
              return null;
            }
          });

          return d3.line()(points);
        };

        const trendLinePath = (data) => {
          let points = data.map(([key, value]) => {
            if (value !== null) {
              return [xScale(key), yScales[metricIndex](value[metricIndex])];
            } else {
              return null;
            }
          });
          return d3.line()(points);
        };

        // const zoom = d3
        //   .zoom()
        //   .scaleExtent([0.5, 20])
        //   .extent([
        //     [0, 0],
        //     [width, height],
        //   ])
        //   .on('zoom', (e) => {
        //     const newXScale = e.transform.rescaleX(xScale);
        //     setCurrentZoomState(newXScale.domain());
        //   });

        // const zoomRef = (ref) => d3.select(ref).call(zoom);

        const brush = d3
          .brushX()
          .extent([
            [0, 0],
            [width, height],
          ])
          .on('end', (e) => {
            if (e.selection) {
              const indexSelection = e.selection.map(xScale.invert);
              setRangeSelection(indexSelection);
              d3.selectAll('.brush').call(brush.move, null);
            }
          });

        d3.selectAll('.brush').call(brush);

        const resetXScale = () => setRangeSelection();

        return (
          <React.Fragment key={metricName + metricIndex}>
            <div className="time-series__metric-name">{metricName}</div>
            <svg
              preserveAspectRatio="xMinYMin meet"
              key={`time-series--${metricName}`}
              width={width + margin.left + margin.right}
              height={height + margin.top + margin.bottom}
            >
              <g
                id={metricName}
                transform={`translate(${margin.left},${margin.top})`}
              >
                <g className="brush" onDoubleClick={resetXScale} />
                <g
                  className="time-series__runs-axis"
                  ref={getXAxis}
                  transform={`translate(0,${height})`}
                />

                <g className="time-series__metric-axis" ref={getYAxis} />

                <g
                  className="time-series__metric-axis-dual"
                  ref={getYAxis}
                  transform={`translate(${width},0)`}
                />

                <text
                  className="time-series__axis-label"
                  y={10 - margin.left}
                  x={-10 - height / 2}
                >
                  value
                </text>

                <g className="time-series__run-lines">
                  {parsedData.map(([key, _], index) => (
                    <line
                      className={classnames('time-series__run-line', {
                        'time-series__run-line--hovered':
                          hoveredElementId === runKeys[index],
                        'time-series__run-line--blend':
                          hoveredElementId || selectedRuns.length > 1,
                      })}
                      id={runKeys[index]}
                      key={key + index}
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
                  <g className="time-series__hovered-line-group">
                    {hoveredValues.map((value, index) => {
                      if (metricIndex === index) {
                        return (
                          <React.Fragment key={value + index}>
                            <line
                              className="time-series__hovered-line"
                              x1={0}
                              y1={yScales[index](value)}
                              x2={width}
                              y2={yScales[index](value)}
                            />
                            <g className="time-series__ticks">
                              <line
                                className="time-series__tick-line"
                                x1={xScale(hoveredElementDate)}
                                y1={yScales[index](value)}
                                x2={xScale(hoveredElementDate) - 5}
                                y2={yScales[index](value)}
                              />
                              <text
                                className="time-series__tick-text"
                                x={xScale(hoveredElementDate)}
                                y={yScales[index](value)}
                              >
                                {value.toFixed(3)}
                              </text>
                            </g>
                          </React.Fragment>
                        );
                      } else {
                        return null;
                      }
                    })}
                    ;
                  </g>
                )}

                <g className="time-series__selected-group">
                  {selectedOrderedData.map(([key, value], index) => (
                    <React.Fragment key={key + value}>
                      <line
                        className={`time-series__run-line--selected-${index}`}
                        x1={xScale(key)}
                        y1={0}
                        x2={xScale(key)}
                        y2={height}
                      />
                      <text
                        className="time-series__tick-text"
                        x={xScale(key)}
                        y={yScales[metricIndex](value[metricIndex])}
                      >
                        {value[metricIndex].toFixed(3)}
                      </text>
                      <path
                        className={`time-series__marker--selected-${index}`}
                        d={`${d3.symbol(selectedMarkerShape[index], 20)()}`}
                        transform={`translate(${xScale(key)},${yScales[
                          metricIndex
                        ](value[metricIndex])}) 
                  rotate(${selectedMarkerRotate[index]})`}
                      />
                    </React.Fragment>
                  ))}
                </g>

                <g
                  className={classnames('time-series__metric-line', {
                    'time-series__metric-line--blend':
                      hoveredElementId || selectedRuns.length > 1,
                  })}
                >
                  <path d={linePath(metricValues)} />
                </g>

                <g className="time-series__trend-line">
                  <path d={trendLinePath(selectedData)} />
                </g>
              </g>
            </svg>
          </React.Fragment>
        );
      })}
    </div>
  );
};
