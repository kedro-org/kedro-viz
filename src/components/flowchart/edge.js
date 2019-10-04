import React, { useEffect, useState, useRef } from 'react';
import classnames from 'classnames';
import { CSSTransition } from 'react-transition-group';
import 'd3-transition';
import { interpolatePath } from 'd3-interpolate-path';
import { select } from 'd3-selection';
import { curveBasis, line } from 'd3-shape';
import { DURATION } from './index';

// Set up line shape function
const lineShape = points =>
  points &&
  line()
    .x(d => d.x)
    .y(d => d.y)
    .curve(curveBasis)(points);

export default ({ edge, in: show, faded }) => {
  const pathRef = useRef(null);
  const [prevEdge, setEdgeState] = useState(edge);

  useEffect(() => {
    if (!edge.points) {
      return;
    }
    const current = lineShape(edge.points);
    const previous = lineShape(prevEdge.points);
    select(pathRef.current)
      .transition('update-edge-path')
      .duration(DURATION)
      .attrTween('d', () => interpolatePath(previous, current))
      .end()
      .catch(() => {})
      .finally(() => {
        setEdgeState(edge);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edge.points]);

  return (
    <CSSTransition
      classNames="edge"
      timeout={DURATION}
      mountOnEnter
      unmountOnExit
      appear
      in={show}>
      <g data-id={edge.id}>
        <path
          className={classnames('edge-path', {
            'edge-path--faded': faded
          })}
          ref={pathRef}
          markerEnd="url(#arrowhead)"
          d={lineShape(prevEdge.points)}
        />
      </g>
    </CSSTransition>
  );
};
