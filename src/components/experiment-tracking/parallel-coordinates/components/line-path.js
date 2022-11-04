import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export const LinePath = ({
  selected,
  d,
  id,
  fill,
  stroke,
  setHoveredId,
  isHovered,
}) => {
  const lineRef = useRef();

  const setHighlight = (el, highlighted) => {
    if (highlighted) {
      el.style('stroke', `white`);
      el.style('cursor', 'pointer');
    } else {
      el.style('stroke', '#132631');
    }
  };

  useEffect(() => {
    let el = d3.select(lineRef.current);

    if (!selected) {
      el.on('mouseover', () => {
        setHoveredId(id);
        setHighlight(el, true);
      });

      el.on('mouseout', () => {
        setHoveredId(null);
        setHighlight(el, false);
      });

      if (isHovered) {
        setHighlight(el, true);
      } else {
        setHighlight(el, false);
      }
    }
  });

  return (
    <path
      className="line-path"
      d={d}
      fill={fill}
      id={id}
      key={id}
      ref={lineRef}
      stroke={stroke}
    ></path>
  );
};
