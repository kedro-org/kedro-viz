import React from 'react';
import classnames from 'classnames';
import Icon from '@quantumblack/kedro-ui/lib/components/icon';
import MenuIcon from '../icons/menu';

/**
 * Hamburger menu button
 * @param {Function} props.onToggle Show menu on click
 * @param {Boolean} props.sidebarVisible Whether the sidebar is visible
 */
export const ShowMenuButton = ({ onToggle, visible: sidebarVisible }) => (
  <button
    aria-label="Show menu"
    className={classnames(
      'pipeline-sidebar__show-menu pipeline-sidebar__icon-button',
      {
        'pipeline-sidebar__icon-button--visible': !sidebarVisible
      }
    )}
    onClick={() => onToggle(true)}>
    <MenuIcon className="pipeline-icon" />
  </button>
);

/**
 * ⨉-shaped button to close the menu. Hidden when menu is closed.
 * @param {Function} props.onToggle Show menu on click
 * @param {string} props.theme Kedro-UI theme: 'light' or 'dark'
 * @param {Boolean} props.sidebarVisible Whether the sidebar is visible
 */
export const HideMenuButton = ({
  onToggle,
  theme,
  visible: sidebarVisible
}) => (
  <button
    aria-label="Hide menu"
    className={classnames(
      'pipeline-sidebar__hide-menu pipeline-sidebar__icon-button',
      {
        'pipeline-sidebar__icon-button--visible': sidebarVisible
      }
    )}
    onClick={() => onToggle(false)}>
    <Icon type="close" title="Close" theme={theme} />
  </button>
);
