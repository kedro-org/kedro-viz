import React, { useContext, useState, useEffect } from 'react';
import classnames from 'classnames';
import * as d3 from 'd3';
import { HoverStateContext } from '../utils/hover-state-context';
import Tooltip from '../../ui/tooltip';

import { LinePath } from './components/line-path.js';

import './parallel-coordinates.css';

const renderTextForRun = (name, date) => {
  return (
    <div className="parallel-coords-tooltip">
      <h3>Run name:</h3>
      <p>{name}</p>
      <h3>Date:</h3>
      <p>{date}</p>
    </div>
  );
};

const renderTextFoMetric = (name, count) => {
  return (
    <div className="parallel-coords-tooltip">
      <h3>Metric name:</h3>
      <p>{name}</p>
      <h3>Count:</h3>
      <p>{count}</p>
    </div>
  );
};

// TODO: move them to a cofig file or something
const width = 1500,
  height = 800,
  padding = 38,
  paddingLr = 50;

const buffer = 0.05;
const selectedMarkerRotate = [45, 0, 0];

const selectedMarkerColors = ['#00E3FF', '#3BFF95', '#FFE300'];
const selectedLineColors = ['#00BCFF', '#31E27B', '#FFBC00'];

const mockChartSize = {
  left: 0,
  top: 0,
  right: 100,
  bottom: 100,
  width: 120,
  height: 104,
};

export const ParallelCoordinates = ({ DATA1, selectedRuns }) => {
  const [hoveredAxisG, setHoveredAxisG] = useState(null);
  const [showTooltip, setShowTooltip] = useState({
    targetRect: null,
    text: null,
    visible: false,
  });
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

  const selectedValues = [];
  selectedData.map(([id, values]) => {
    return values.map((value) => selectedValues.push(value));
  });

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

    const hoveredElement = graph.find(([id, values]) => id === key);
    setShowTooltip({
      targetRect: e.currentTarget.getBoundingClientRect(),
      text: renderTextFoMetric(key, hoveredElement[1].length),
      visible: true,
    });
  };

  const handleMouseOutMetric = () => {
    setHoveredAxisG(null);
    setShowTooltip({
      targetRect: null,
      text: null,
      visible: false,
    });
  };

  useEffect(() => {
    if (hoveredElementId) {
      setShowTooltip({
        visible: true,
        text: renderTextForRun(hoveredElementId, hoveredElementId),
      });
    } else {
      setShowTooltip({
        visible: false,
        text: null,
      });
    }
  }, [hoveredElementId]);

  useEffect(() => {
    const axisG = d3.selectAll('.feature');

    if (axisG) {
      axisG.append('g').each(function (each, index) {
        const key = graphKeys[index];
        d3.select(this).call(yAxis[key]);
      });
    }
  }, [graphKeys, yAxis]);

  return (
    <div className="parallelCoordinates">
      <svg
        style={{
          height: '90vh',
          width: '80vw',
        }}
      >
        {graphKeys.map((key) => (
          <g
            className={classnames('feature', {
              'feature--hovered': hoveredAxisG === key,
            })}
            transform={`translate(${xScale(key)}, 0)`}
            y={padding / 2}
          >
            <text
              className="headers"
              textAnchor="middle"
              y={padding / 2}
              onMouseOver={(e) => handleMouseOverMetric(e, key)}
              onMouseOut={handleMouseOutMetric}
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
              key={i}
              setHoveredId={setHoveredElementId}
              setShowTooltip={setShowTooltip}
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
              key={i}
              selected
              stroke={selectedLineColors[i]}
            />
          ))}
        </g>

        {graph.map(([id, values]) => (
          <g className="ticks" id={id}>
            {values.map((value, index) => {
              if (!selectedValues.includes(value)) {
                return (
                  <>
                    <text
                      className={classnames('text', {
                        'text--hovered': hoveredElementId === id,
                      })}
                      x={xScale(id) + padding / 2}
                      y={yScales[id](value)}
                      style={{
                        textAnchor: 'end',
                        transform: 'translate(-10,4)',
                      }}
                    >
                      {value}
                    </text>
                    <line
                      className="line"
                      x1={xScale(id)}
                      y1={yScales[id](value)}
                      x2={xScale(id) - 4}
                      y2={yScales[id](value)}
                    ></line>
                  </>
                );
              }
            })}
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
                    x={xScale(graphKeys[index]) - 10}
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
      {showTooltip.visible && (
        <Tooltip
          chartSize={mockChartSize}
          targetRect={showTooltip.targetRect}
          text={showTooltip.text}
          visible={showTooltip.visible}
        />
      )}
    </div>
  );
};
