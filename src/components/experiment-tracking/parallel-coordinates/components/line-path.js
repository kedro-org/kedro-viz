import React from 'react';
import { useD3 } from '../../../../utils/hooks/use-d3';

export const LinePath = ({
  d,
  fill,
  id,
  isHovered,
  selected,
  setHoveredId,
  stroke,
}) => {
  const setHighlight = (el, highlighted) => {
    if (highlighted) {
      el.style('stroke', `white`);
      el.style('cursor', 'pointer');
    } else {
      el.style('stroke', '#132631');
    }
  };

  const ref = useD3((el) => {
    if (!selected) {
      el.on('mouseover', (e) => setHoveredId(id));

      el.on('mouseout', () => setHoveredId(null));

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
      ref={ref}
      stroke={stroke}
      strokeWidth="1.5"
    />
  );
};
