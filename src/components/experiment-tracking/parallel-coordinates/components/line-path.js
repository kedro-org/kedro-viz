import React, { useRef, useEffect, useContext } from 'react';
import * as d3 from 'd3';

import { HoverStateContext } from '../../utils/hover-state-context';

export const LinePath = ({ selected, d, id, fill, stroke }) => {
  const lineRef = useRef();

  const { handleMouseOut, handleMouseOver } = useContext(HoverStateContext);

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
        handleMouseOver(id);
        setHighlight(el, true);
      });

      el.on('mouseout', () => {
        handleMouseOut();
        setHighlight(el, false);
      });
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
