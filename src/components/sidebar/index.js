import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import Icon from '@quantumblack/kedro-ui/lib/components/icon';
import { toggleSidebar } from '../../actions';
import TagList from '../tag-list';
import NodeList from '../node-list';
import MenuIcon from '../icons/menu';
import './sidebar.css';

/**
 * Hamburger menu button
 * @param {Function} props.onToggle Show menu on click
 * @param {Boolean} props.visible Whether nav is visible
 */
export const ShowMenuButton = ({ onToggle, visible }) => (
  <button
    aria-label="Show menu"
    className={classnames(
      'pipeline-sidebar__show-menu pipeline-sidebar__icon-button',
      {
        'pipeline-sidebar__icon-button--visible': !visible
      }
    )}
    onClick={() => onToggle(!visible)}>
    <MenuIcon className="pipeline-icon" />
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
    className={classnames(
      'pipeline-sidebar__hide-menu pipeline-sidebar__icon-button',
      {
        'pipeline-sidebar__icon-button--visible': visible
      }
    )}
    onClick={() => {
      onToggle(!visible);
    }}>
    <Icon type="close" title="Close" theme={theme} />
  </button>
);

/**
 * Main app container. Handles showing/hiding the sidebar nav, and theme classes.
 * @param {Object} props onToggle, theme, and visible
 */
const Sidebar = props => (
  <>
    <ShowMenuButton {...props} />
    <nav
      className={classnames('pipeline-sidebar', {
        'pipeline-sidebar--visible': props.visible
      })}>
      <HideMenuButton {...props} />
      <div className="pipeline-ui">
        <TagList />
        <NodeList />
      </div>
    </nav>
  </>
);

export const mapStateToProps = state => ({
  theme: state.theme,
  visible: state.visible.sidebar
});

export const mapDispatchToProps = dispatch => ({
  onToggle: visible => {
    dispatch(toggleSidebar(visible));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Sidebar);
