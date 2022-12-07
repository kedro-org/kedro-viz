import React, { useContext, useState, useEffect, useMemo } from 'react';
import classnames from 'classnames';
import * as d3 from 'd3';
import { HoverStateContext } from '../utils/hover-state-context';
import { v4 as uuidv4 } from 'uuid';
import { MetricsChartsTooltip, tooltipDefaultProps } from '../tooltip/tooltip';
import { getTooltipPosition } from '../tooltip/get-tooltip-position';
import { formatTimestamp } from '../../../utils/date-utils';

import './parallel-coordinates.css';

// TODO: move these to a config file?
const padding = 38;
const paddingLr = 80;
const axisGapBuffer = 3;
const selectedMarkerRotate = [45, 0, 0];

const selectedMarkerColors = ['#00E3FF', '#3BFF95', '#FFE300'];

const yAxis = {};
const yScales = {};

export const ParallelCoordinates = ({ metricsData, selectedRuns }) => {
  const [chartHeight, setChartHeight] = useState(0);
  const [chartWidth, setChartWidth] = useState(0);
  const [hoveredMetricLabel, setHoveredMetricLabel] = useState(null);
  const [showTooltip, setShowTooltip] = useState(tooltipDefaultProps);

  const { hoveredElementId, setHoveredElementId } =
    useContext(HoverStateContext);

  const selectedMarkerShape = [
    d3.symbolSquare,
    d3.symbolCircle,
    d3.symbolTriangle,
  ];

  const graph = Object.entries(metricsData.metrics);
  const graphKeys = useMemo(
    () => Object.keys(metricsData.metrics),
    [metricsData.metrics]
  );

  const data = Object.entries(metricsData.runs);
  const selectedData = data
    .filter(([key]) => selectedRuns.includes(key))
    .sort((a, b) => {
      // We need to sort the selected data to match the order of selectedRuns.
      // If we didn't, the highlighted runs would switch colors unnecessarily.
      return selectedRuns.indexOf(a[0]) - selectedRuns.indexOf(b[0]);
    });

  const hoveredValues = hoveredElementId && metricsData.runs[hoveredElementId];

  const xScale = d3
    .scalePoint()
    .domain(graphKeys)
    .range([paddingLr, chartWidth - paddingLr]);

  // For each metric, draw a y-scale
  graph.forEach(([key, value]) => {
    yScales[key] = d3
      .scaleLinear()
      .domain([d3.min(value), d3.max(value)])
      .range([chartHeight - padding * 2.15, padding + padding / axisGapBuffer]);
  });

  Object.entries(yScales).forEach(([key, value]) => {
    yAxis[key] = d3.axisLeft(value).ticks(0).tickSizeOuter(0);
  });

  const lineGenerator = d3.line().defined(function (d) {
    return d !== null;
  });

  const linePath = function (d) {
    const points = d.map((x, i) => {
      if (x !== null) {
        return [xScale(graphKeys[i]), yScales[graphKeys[i]](x)];
      } else {
        return null;
      }
    });

    return lineGenerator(points);
  };

  const handleMouseOverMetric = (e, key) => {
    const runsCount = graph.find((each) => each[0] === key)[1].length;
    const { x, y, direction } = getTooltipPosition(e);

    setHoveredMetricLabel(key);

    setShowTooltip({
      content: {
        label1: 'Metric name',
        value1: key,
        label2: 'Run count',
        value2: runsCount,
      },
      direction,
      position: { x, y },
      visible: true,
    });
  };

  const handleMouseOutMetric = () => {
    setHoveredMetricLabel(null);
    setShowTooltip(tooltipDefaultProps);
  };

  const handleMouseOverLine = (e, key) => {
    setHoveredElementId(key);

    if (e) {
      const parsedDate = new Date(formatTimestamp(key));
      const { x, y, direction } = getTooltipPosition(e);

      setShowTooltip({
        content: {
          label1: 'Run name',
          value1: key,
          label2: 'Date',
          value2: parsedDate.toLocaleDateString('default', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
        },
        direction,
        position: { x, y },
        visible: true,
      });
    }
  };

  const handleMouseOutLine = () => {
    setHoveredElementId(null);
    setShowTooltip(tooltipDefaultProps);
  };

  useEffect(() => {
    d3.select(`.run-line[id="${hoveredElementId}"]`).raise();
  }, [hoveredElementId]);

  useEffect(() => {
    d3.select(`.metric-axis[id="${hoveredMetricLabel}"]`).raise();
    d3.selectAll(`.selected-runs`).raise();
    d3.selectAll(`.selected-runs > path`).raise();
  }, [hoveredMetricLabel]);

  useEffect(() => {
    setChartWidth(
      document.querySelector('.metrics-plots-wrapper__charts').clientWidth
    );

    setChartHeight(
      document.querySelector('.metrics-plots-wrapper__charts').clientHeight
    );
  }, []);

  return (
    <div className="parallel-coordinates">
      <MetricsChartsTooltip
        content={showTooltip.content}
        direction={showTooltip.direction}
        position={showTooltip.position}
        visible={showTooltip.visible}
      />

      <svg
        preserveAspectRatio="xMinYMin meet"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        width="100%"
      >
        {graphKeys.map((metricName) => {
          const getYAxis = (ref) => {
            d3.select(ref).call(yAxis[metricName]).attr('id', metricName);
          };

          return (
            <g
              className={classnames('metric-axis', {
                'metric-axis--hovered': hoveredMetricLabel === metricName,
                'metric-axis--faded':
                  hoveredMetricLabel && hoveredMetricLabel !== metricName,
              })}
              key={`metric-axis--${metricName}`}
              ref={getYAxis}
              transform={`translate(${xScale(metricName)}, 0)`}
              y={padding / 2}
            >
              <text
                className="headers"
                key={`metric-axis-text--${metricName}`}
                onMouseOut={handleMouseOutMetric}
                onMouseOver={(e) => handleMouseOverMetric(e, metricName)}
                textAnchor="middle"
                y={padding / 2}
              >
                {metricName.length > 10
                  ? metricName.substring(0, 20)
                  : metricName}
              </text>
            </g>
          );
        })}

        <g className="run-lines">
          {data.map(([runId, value], i) => {
            return (
              <path
                className={classnames('run-line', {
                  'run-line--hovered': hoveredElementId === runId,
                  'run-line--faded':
                    (hoveredElementId && hoveredElementId !== runId) ||
                    hoveredMetricLabel,
                })}
                d={linePath(value, i)}
                id={runId}
                key={runId}
                onMouseLeave={handleMouseOutLine}
                onMouseOver={(e) => handleMouseOverLine(e, runId)}
              />
            );
          })}
        </g>

        {graph.map(([metricName, values], metricIndex) => {
          // To avoid rendering a tick more than once
          const uniqueValues = values
            .filter((value, i, self) => self.indexOf(value) === i)
            .filter((value) => value !== null)
            .sort((a, b) => a - b);

          return (
            <g className="tick-values" id={metricName} key={uuidv4()}>
              {uniqueValues.map((value) => {
                // To ensure the hoveredValues are matched the exact position from metrics
                const hightlightedValue =
                  hoveredValues &&
                  hoveredValues.find(
                    (value, index) => index === metricIndex && value
                  );

                return (
                  <text
                    className={classnames('text', {
                      'text--hovered':
                        hoveredMetricLabel === metricName ||
                        (hightlightedValue && hightlightedValue === value),
                      'text--faded':
                        (hoveredMetricLabel &&
                          hoveredMetricLabel !== metricName) ||
                        (hightlightedValue && hightlightedValue !== value),
                    })}
                    key={uuidv4()}
                    x={xScale(metricName) - 8}
                    y={yScales[metricName](value) + 3}
                    style={{
                      textAnchor: 'end',
                      transform: 'translate(-10,4)',
                    }}
                  >
                    {value.toFixed(3)}
                  </text>
                );
              })}
            </g>
          );
        })}

        {graph.map(([metricName, values], metricIndex) => {
          const sortedValues = values
            .filter((value) => value !== null)
            .sort((a, b) => a - b);

          return (
            <g
              className="tick-lines"
              id={metricName}
              key={`tick-lines--${metricName}`}
            >
              {sortedValues.map((value) => {
                // To ensure the hoveredValues are matched the exact position from metrics
                const hightlightedValue =
                  hoveredValues &&
                  hoveredValues.find(
                    (value, index) => index === metricIndex && value
                  );

                if (value) {
                  return (
                    <line
                      className={classnames('line', {
                        'line--hovered':
                          hoveredMetricLabel === metricName ||
                          (hightlightedValue && hightlightedValue === value),
                        'line--faded':
                          (hoveredMetricLabel &&
                            hoveredMetricLabel !== metricName) ||
                          (hightlightedValue && hightlightedValue !== value),
                      })}
                      key={uuidv4()}
                      x1={xScale(metricName)}
                      x2={xScale(metricName) - 4}
                      y1={yScales[metricName](value)}
                      y2={yScales[metricName](value)}
                    />
                  );
                } else {
                  return null;
                }
              })}
            </g>
          );
        })}

        <g className="selected-runs">
          {selectedData.map(([id, value], i) => (
            <path
              className={classnames({
                'run-line--selected-first': i === 0,
                'run-line--selected-second': i === 1,
                'run-line--selected-third': i === 2,
              })}
              d={linePath(value, i)}
              id={id}
              key={id}
            />
          ))}

          {selectedData.map(([, values], i) =>
            values.map((value, index) => {
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
                    x={xScale(graphKeys[index]) - 8}
                    y={yScales[graphKeys[index]](value) + 3}
                    style={{
                      textAnchor: 'end',
                      transform: 'translate(-10,4)',
                    }}
                  >
                    {value.toFixed(3)}
                  </text>
                </React.Fragment>
              );
            })
          )}
        </g>
      </svg>
    </div>
  );
};
