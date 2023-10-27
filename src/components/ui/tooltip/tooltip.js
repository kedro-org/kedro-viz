import React from 'react';
import classnames from 'classnames';
import './tooltip.scss';

const zeroWidthSpace = String.fromCharCode(0x200b);

/**
 * Force tooltip text to break on special characters
 * @param {String} text Any text with special characters
 * @return {String} text
 */
export const insertZeroWidthSpace = (text) =>
  text.replace(/([^\w\s]|[_])/g, `${zeroWidthSpace}$1${zeroWidthSpace}`);

/**
 * Display flowchart node tooltip
 * @param {Object} chartSize Chart dimensions in pixels
 * @param {Object} targetRect event.target.getBoundingClientRect()
 * @param {Boolean} visible Whether to show the tooltip
 * @param {String} text Tooltip display label
 * @param {boolean}  noDelay Where to show the tooltip immediately or after 1 sec delay
 * @param {boolean}  centerArrow Where to center tooltip arrow or not
 * @param {string}  arrowSize Tooltip arrow size regular | small
 */
const Tooltip = ({
  chartSize,
  targetRect,
  visible,
  text,
  noDelay,
  centerArrow,
  arrowSize,
}) => {
  let isTop, isRight, x, y;

  if (chartSize && Object.keys(chartSize).length) {
    const { left, top, width, height, outerWidth, sidebarWidth } = chartSize;

    isRight = targetRect.left - sidebarWidth > width / 2;
    isTop = targetRect.top < height / 2;
    const xOffset = isRight ? targetRect.left - outerWidth : targetRect.left;
    const yOffset = isTop ? targetRect.top + targetRect.height : targetRect.top;
    x = xOffset - left + targetRect.width / 2;
    y = yOffset - top;
  } else {
    x = targetRect.left - targetRect.width / 2;
    y = targetRect.top;
  }

  return (
    <div
      className={classnames('pipeline-tooltip', {
        'pipeline-tooltip--visible': visible,
        'pipeline-tooltip--right': isRight,
        'pipeline-tooltip--top': isTop,
        'pipeline-tooltip--no-delay': noDelay,
        'pipeline-tooltip--center-arrow': centerArrow,
        'pipeline-tooltip--small-arrow': arrowSize === 'small',
      })}
      style={{
        transform: `translate(${x}px, ${y}px)`,
      }}
    >
      <div className={classnames('pipeline-tooltip__text', {})}>
        {insertZeroWidthSpace(text)}
      </div>
    </div>
  );
};

Tooltip.defaultProps = {
  chartSize: {},
  targetRect: {},
  visible: false,
  text: '',
  noDelay: false,
  centerArrow: false,
  arrowSize: 'regular',
};

export default Tooltip;
