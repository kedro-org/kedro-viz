import React from 'react';
import './context-menu.css';
import classnames from 'classnames';

const zeroWidthSpace = String.fromCharCode(0x200b);

/**
 * Force tooltip text to break on special characters
 * @param {string} text Any text with special characters
 * @return {string} text
 */
export const insertZeroWidthSpace = text =>
  text.replace(/([^\w\s]|[_])/g, `${zeroWidthSpace}$1${zeroWidthSpace}`);

/**
 * Display flowchart node tooltip
 * @param {object} chartSize Chart dimensions in pixels
 * @param {object} targetRect event.target.getBoundingClientRect()
 * @param {boolean} visible Whether to show the tooltip
 * @param {string} text Tooltip display label
 */
const ContextMenu = ({ chartSize, targetRect, visible, hooks }) => {
  if (!visible) {
    return null;
  }

  const { left, top, width, height, outerWidth, sidebarWidth } = chartSize;
  const isRight = targetRect.left - sidebarWidth > width / 2;
  const isTop = targetRect.top < height / 2;
  const xOffset = isRight ? targetRect.left - outerWidth : targetRect.left;
  const yOffset = isTop ? targetRect.top + targetRect.height : targetRect.top;
  const x = xOffset - left + targetRect.width / 2;
  const y = yOffset - top;
  /* eslint-disable no-restricted-globals */
  const list = Object.keys(hooks).map((key, ix) => (
    <div key={ix}>
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={`${location.href}api/ge/?path=${encodeURIComponent(hooks[key])}`}>
        View {key}
      </a>
    </div>
  ));

  return (
    <div
      className={classnames('pipeline-context-menu', {
        'pipeline-context-menu--visible': visible,
        'pipeline-context-menu--right': isRight,
        'pipeline-context-menu--top': isTop
      })}
      style={{ transform: `translate(${x}px, ${y}px)` }}>
      {list}
    </div>
  );
};

ContextMenu.defaultProps = {
  chartSize: {},
  targetRect: {},
  visible: false,
  hooks: {}
};

export default ContextMenu;
