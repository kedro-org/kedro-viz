import React, { useContext, useState, useEffect, useMemo } from 'react';
import classnames from 'classnames';
import * as d3 from 'd3';
import { HoverStateContext } from '../utils/hover-state-context';
import { v4 as uuidv4 } from 'uuid';
import { MetricsChartsTooltip, tooltipDefaultProps } from '../tooltip/tooltip';

import { formatTimestamp } from '../../../utils/date-utils';

import './parallel-coordinates.css';

// TODO: move these to a config file?
const padding = 38;
const paddingLr = 80;
const axisGapBuffer = 3;
const selectedMarkerRotate = [45, 0, 0];

const sideBarWidth = 540;
const tooltipMaxWidth = 300;
const delayTooltipTiming = 1000;

const selectedMarkerColors = ['#00E3FF', '#3BFF95', '#FFE300'];

const yAxis = {};
const yScales = {};

export const ParallelCoordinates = ({ metricsData, selectedRuns }) => {
  const [hoveredAxisG, setHoveredAxisG] = useState(null);
  const [chartHeight, setChartHeight] = useState(0);
  const [chartWidth, setChartWidth] = useState(0);
  const [showTooltip, setShowTooltip] = useState(tooltipDefaultProps);

  const { hoveredElementId, setHoveredElementId } =
    useContext(HoverStateContext);

  const selectedMarkerShape = [
    d3.symbolSquare,
    d3.symbolTriangle,
    d3.symbolCircle,
  ];

  const graph = Object.entries(metricsData.metrics);
  const graphKeys = useMemo(
    () => Object.keys(metricsData.metrics),
    [metricsData.metrics]
  );

  const data = Object.entries(metricsData.runs);
  const selectedData = data.filter(([key]) => selectedRuns.includes(key));

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
    setHoveredAxisG(key);

    const rect = e.target.getBoundingClientRect();

    let x, direction;

    if (window.innerWidth - rect.x > tooltipMaxWidth) {
      x = e.clientX - sideBarWidth;
      direction = 'right';
    } else {
      x = e.clientX - sideBarWidth - sideBarWidth / 2;
      direction = 'left';
    }
    const y = rect.y - 140;

    const timeout = setTimeout(
      () =>
        setShowTooltip({
          content: {
            label1: 'Metrics Name',
            value1: key,
            label2: 'Runs Count',
            value2: runsCount,
          },
          direction,
          pos: { x, y },
          visible: true,
        }),
      delayTooltipTiming
    );

    return () => {
      clearTimeout(timeout);
    };
  };

  const handleMouseOutMetric = () => {
    setHoveredAxisG(null);
    setShowTooltip({
      pos: { x: -500, y: -500 },
      visible: false,
    });
  };

  const handleMouseOverLine = (e, key) => {
    setHoveredElementId(key);

    if (e) {
      let x, direction;

      if (window.innerWidth - e.clientX > tooltipMaxWidth) {
        x = e.clientX - sideBarWidth;
        direction = 'right';
      } else {
        x = e.clientX - sideBarWidth - sideBarWidth / 2;
        direction = 'left';
      }
      const y = e.clientY - 150;

      const parsedDate = new Date(formatTimestamp(key));

      const hoverLineTimeout = setTimeout(
        () =>
          setShowTooltip({
            content: {
              label1: 'Metrics Name',
              value1: key,
              label2: 'Date',
              value2: parsedDate.toString(),
            },
            direction,
            pos: { x, y },
            visible: true,
          }),
        delayTooltipTiming
      );

      return () => {
        clearTimeout(hoverLineTimeout);
      };
    }
  };

  const handleMouseOutLine = () => {
    setHoveredElementId(null);

    setShowTooltip({
      pos: { x: -500, y: -500 },
      visible: false,
    });
  };

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
        visible={showTooltip.visible}
        pos={showTooltip.pos}
        direction={showTooltip.direction}
      />

      <svg
        preserveAspectRatio="xMinYMin meet"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        width="100%"
      >
        {graphKeys.map((key) => {
          const getYAxis = (ref) => {
            d3.select(ref).call(yAxis[key]);
          };

          return (
            <g
              className={classnames('feature', {
                'feature--hovered': hoveredAxisG === key,
              })}
              key={`feature--${key}`}
              ref={getYAxis}
              transform={`translate(${xScale(key)}, 0)`}
              y={padding / 2}
            >
              <text
                className="headers"
                key={`feature-text--${key}`}
                onMouseOut={handleMouseOutMetric}
                onMouseOver={(e) => handleMouseOverMetric(e, key)}
                textAnchor="middle"
                y={padding / 2}
              >
                {key}
              </text>
            </g>
          );
        })}

        <g className="active">
          {data.map(([id, value], i) => {
            return (
              <path
                className={classnames('run-line', {
                  'run-line--hovered': hoveredElementId === id,
                })}
                d={linePath(value, i)}
                id={id}
                key={id}
                onMouseLeave={handleMouseOutLine}
                onMouseOver={(e) => {
                  handleMouseOverLine(e, id);
                  d3.select(e.target).raise();
                }}
              />
            );
          })}
        </g>

        {graph.map(([id, values]) => {
          // To avoid rendering a tick more than once
          const uniqueValues = values
            .filter((value, i, self) => self.indexOf(value) === i)
            .filter((value) => value !== null)
            .sort((a, b) => a - b);

          return (
            <g className="tick-values" id={id} key={uuidv4()}>
              {uniqueValues.map((value) => (
                <text
                  className={classnames('text', {
                    'text--hovered':
                      hoveredAxisG === id ||
                      (hoveredValues && hoveredValues.includes(value)),
                  })}
                  key={uuidv4()}
                  x={xScale(id) - 8}
                  y={yScales[id](value) + 3}
                  style={{
                    textAnchor: 'end',
                    transform: 'translate(-10,4)',
                  }}
                >
                  {value.toFixed(4)}
                </text>
              ))}
            </g>
          );
        })}

        <g className="selected">
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
                    x={xScale(graphKeys[index]) - 8}
                    y={yScales[graphKeys[index]](value) + 3}
                    style={{
                      textAnchor: 'end',
                      transform: 'translate(-10,4)',
                    }}
                  >
                    {value.toFixed(4)}
                  </text>
                </React.Fragment>
              );
            })}
          </g>
        ))}

        {graph.map(([id, values]) => {
          const sortedValues = values
            .filter((value) => value !== null)
            .sort((a, b) => a - b);
          return (
            <g className="lines" id={id} key={`lines--${id}`}>
              {sortedValues.map((value) => {
                if (value) {
                  return (
                    <line
                      className={classnames('line', {
                        'line--hovered':
                          hoveredAxisG === id ||
                          (hoveredValues && hoveredValues.includes(value)),
                      })}
                      key={uuidv4()}
                      x1={xScale(id)}
                      x2={xScale(id) - 4}
                      y1={yScales[id](value)}
                      y2={yScales[id](value)}
                    />
                  );
                } else {
                  return null;
                }
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
