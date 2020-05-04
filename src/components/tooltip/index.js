import React from 'react';
import classnames from 'classnames';
import './tooltip.css';

const zeroWidthSpace = String.fromCharCode(0x200b);

/**
 * Force tooltip text to break on special characters
 * @param {string} text Any text with special characters
 * @return {string} text
 */
const insertZeroWidthSpace = text =>
  text.replace(/(\W)/g, `${zeroWidthSpace}$1${zeroWidthSpace}`);

/**
 * Display flowchart node tooltip
 * @param {object} chartSize Chart dimensions in pixels
 * @param {object} targetRect event.target.getBoundingClientRect()
 * @param {boolean} visible Whether to show the tooltip
 * @param {string} text Tooltip display label
 */
const Tooltip = ({ chartSize, targetRect, visible, text }) => {
  const { left, top, width, outerWidth, sidebarWidth } = chartSize;
  const isRight = targetRect.left - sidebarWidth > width / 2;
  const xOffset = isRight ? targetRect.left - outerWidth : targetRect.left;
  const x = xOffset - left + targetRect.width / 2;
  const y = targetRect.top - top;

  return (
    <div
      className={classnames('pipeline-tooltip', {
        'pipeline-tooltip--visible': visible,
        'pipeline-tooltip--right': isRight
      })}
      style={{ transform: `translate(${x}px, ${y}px)` }}>
      <div className="pipeline-tooltip__text">{insertZeroWidthSpace(text)}</div>
    </div>
  );
};

Tooltip.defaultProps = {
  chartSize: {},
  targetRect: {},
  visible: false,
  text: ''
};

export default Tooltip;
