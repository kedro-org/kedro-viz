import React from 'react';
import classnames from 'classnames';

import './tooltip.css';

export const tooltipDefaultProps = {
  content: { label1: '', value1: '', label2: '', value2: '' },
  direction: 'right',
  pos: { x: -500, y: -500 },
  visible: false,
};

export const MetricsChartsTooltip = ({
  content = tooltipDefaultProps.content,
  visible = tooltipDefaultProps.visible,
  pos = tooltipDefaultProps.pos,
  direction = tooltipDefaultProps.direction,
}) => {
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
