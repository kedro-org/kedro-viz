import React from 'react';
import classnames from 'classnames';

/**
 * GraphSVG wraps the SVG root, zoom wrapper, and marker definitions for the graph.
 */
const markerIds = [
  'arrowhead',
  'arrowhead--input',
  'arrowhead--accent--input',
  'arrowhead--accent',
];

export function GraphSVG({
  width,
  height,
  svgRef,
  wrapperRef,
  visibleGraph,
  children,
  ...rest
}) {
  return (
    <svg
      id="pipeline-graph"
      className="pipeline-flowchart__graph"
      width={width}
      height={height}
      ref={svgRef}
      {...rest}
    >
      <g
        id="zoom-wrapper"
        className={classnames('pipeline-zoom-wrapper', {
          'pipeline-zoom-wrapper--hidden': !visibleGraph,
        })}
        ref={wrapperRef}
      >
        <defs>
          {markerIds.map((id) => (
            <marker
              id={`pipeline-${id}`}
              key={id}
              className={`pipeline-flowchart__${id}`}
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerUnits="strokeWidth"
              markerWidth="8"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 L 4 5 z" />
            </marker>
          ))}
        </defs>
        {children}
      </g>
    </svg>
  );
}

export default GraphSVG;
