import React from 'react';
import { useD3 } from '../../../../utils/hooks/use-d3';

const grey400 = '#ABB2B7';
const slate300 = '#1C2E3A';

export const LinePath = ({
  d,
  fill,
  id,
  isHovered,
  selected,
  onMouseOver,
  onMouseOut,
  stroke,
}) => {
  const setHighlight = (el, highlighted) => {
    if (highlighted) {
      el.style('stroke', grey400);
      el.style('cursor', 'pointer');
      el.raise();
    } else {
      el.style('stroke', slate300);
    }
  };

  const ref = useD3((el) => {
    if (!selected) {
      el.on('mouseover', (e) => onMouseOver(e, id));

      el.on('mouseout', () => onMouseOut());

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
    />
  );
};
