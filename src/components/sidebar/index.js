import React from 'react';
import classnames from 'classnames';
import Icon from '@quantumblack/kedro-ui/lib/components/icon';
import ChartUI from '../chart-ui';
import './sidebar.css';

/**
 * Hamburger menu button
 * @param {Function} props.onToggle Show menu on click
 */
export const ShowMenuButton = ({ onToggle }) => (
  <button
    aria-label="Show menu"
    className="pipeline-sidebar__show-menu pipeline-icon-button"
    onClick={onToggle}>
    <svg className="pipeline-menu-icon" viewBox="0 0 24 24">
      <rect x="2" y="5" width="20" height="2" />
      <rect x="2" y="11" width="20" height="2" />
      <rect x="2" y="17" width="20" height="2" />
    </svg>
  </button>
);

/**
 * ⨉-shaped button to close the menu. Hidden when menu is closed.
 * @param {Function} props.onToggle Show menu on click
 * @param {string} props.theme Kedro-UI theme: 'light' or 'dark'
 * @param {Boolean} props.visible Whether nav is visible
 */
export const HideMenuButton = ({ onToggle, theme, visible }) => (
  <button
    aria-label="Hide menu"
    className={classnames('pipeline-sidebar__hide-menu pipeline-icon-button', {
      'pipeline-sidebar__hide-menu--visible': visible
    })}
    onClick={onToggle}>
    <Icon type="close" title="Close" theme={theme} />
  </button>
);

/**
 * Main app container. Handles showing/hiding the sidebar nav, and theme classes.
 * @param {Object} props onToggle, theme, and visible
 */
export const Sidebar = props => (
  <>
    <ShowMenuButton onToggle={props.onToggle} />
    <nav
      className={classnames('pipeline-sidebar', {
        'pipeline-sidebar--visible': props.visible
      })}>
      <HideMenuButton {...props} />
      <ChartUI />
    </nav>
  </>
);

export default Sidebar;
