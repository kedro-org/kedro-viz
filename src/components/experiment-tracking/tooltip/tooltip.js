import React from 'react';
import classnames from 'classnames';

import './tooltip.css';

export const Tooltip = ({ content, visible, pos, direction }) => {
  return (
    <div
      className={classnames('tooltip', { 'tooltip--show': visible })}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
    >
      <span
        className={classnames('tooltip-arrow', `tooltip-arrow--${direction}`)}
      />
      <h3 className="tooltip-label">{`${content?.label1}:`}</h3>
      <h4 className="tooltip-value">{content?.value1}</h4>

      <br />
      <h3 className="tooltip-label">{`${content?.label2}:`}</h3>
      <h4 className="tooltip-value">{content?.value2}</h4>
    </div>
  );
};
