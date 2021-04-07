import React from 'react';
import classnames from 'classnames';
import './tooltip.css';
import PlotlyChart from '../plotly-chart';

const zeroWidthSpace = String.fromCharCode(0x200b);

/**
 * Force tooltip text to break on special characters
 * @param {string} text Any text with special characters
 * @return {string} text
 */
export const insertZeroWidthSpace = (text) =>
  text.replace(/([^\w\s]|[_])/g, `${zeroWidthSpace}$1${zeroWidthSpace}`);

/**
 * Display flowchart node tooltip
 * @param {object} chartSize Chart dimensions in pixels
 * @param {object} targetRect event.target.getBoundingClientRect()
 * @param {boolean} visible Whether to show the tooltip
 * @param {string} text Tooltip display label
 */
const Tooltip = ({ chartSize, targetRect, visible, text, graph }) => {
  const { left, top, width, height, outerWidth, sidebarWidth } = chartSize;
  const isRight = targetRect.left - sidebarWidth > width / 2;
  const isTop = targetRect.top < height / 2;
  const xOffset = isRight ? targetRect.left - outerWidth : targetRect.left;
  const yOffset = isTop ? targetRect.top + targetRect.height : targetRect.top;
  const x = xOffset - left + targetRect.width / 2;
  const y = yOffset - top;

  return (
    <div
      className={classnames('pipeline-tooltip', {
        'pipeline-tooltip--visible': visible,
        'pipeline-tooltip--right': isRight,
        'pipeline-tooltip--top': isTop,
      })}
      style={{ transform: `translate(${x}px, ${y}px)` }}>
      <div className="pipeline-tooltip__text">
        {insertZeroWidthSpace(text)}
        {graph && (
          <PlotlyChart
            data={graph.data}
            layout={graph.layout}
            config={graph.config}
            isTooltip={true}
          />
        )}
      </div>
    </div>
  );
};

Tooltip.defaultProps = {
  chartSize: {},
  targetRect: {},
  visible: false,
  text: '',
  graph: false,
};

export default Tooltip;
