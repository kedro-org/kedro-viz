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
 * @param {string}  arrowSize Tooltip arrow size regular | small
 * @param {boolean}  centerArrow Where to center tooltip arrow or not
 * @param {Object} chartSize Chart dimensions in pixels
 * @param {boolean}  noDelay Where to show the tooltip immediately or after 1 sec delay
 * @param {Object}  style Tooltip custom css
 * @param {Object} targetRect event.target.getBoundingClientRect()
 * @param {String} text Tooltip display label
 * @param {Boolean} visible Whether to show the tooltip
 */
const Tooltip = ({
  arrowSize = 'regular',
  centerArrow = false,
  chartSize = {},
  noDelay = false,
  style = {},
  targetRect = {},
  text = '',
  visible = false,
}) => {
  let isTop = false,
    isRight = false;
  const isFlowchartTooltip = chartSize && Object.keys(chartSize).length;
  const styles = { ...style };

  if (isFlowchartTooltip) {
    let x = 0,
      y = 0;
    const { left, top, width, height, outerWidth, sidebarWidth } = chartSize;

    isRight = targetRect.left - sidebarWidth > width / 2;
    isTop = targetRect.top < height / 2;

    const xOffset = isRight ? targetRect.left - outerWidth : targetRect.left;
    const yOffset = isTop ? targetRect.top + targetRect.height : targetRect.top;

    x = xOffset - left + targetRect.width / 2;
    y = yOffset - top;

    styles.transform = `translate(${x}px, ${y}px)`;
  }

  return (
    <div
      className={classnames('pipeline-tooltip', {
        'pipeline-tooltip--visible': visible,
        'pipeline-tooltip--right': isRight,
        'pipeline-tooltip--top': isTop,
        'pipeline-tooltip--chart': isFlowchartTooltip,
        'pipeline-tooltip--no-delay': noDelay,
        'pipeline-tooltip--center-arrow': centerArrow,
        'pipeline-tooltip--small-arrow': arrowSize === 'small',
      })}
      style={styles}
    >
      <div className="pipeline-tooltip__text">{insertZeroWidthSpace(text)}</div>
    </div>
  );
};

export default Tooltip;
