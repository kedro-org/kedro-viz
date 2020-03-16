import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { toggleSidebar } from '../../actions';
import TagList from '../tag-list';
import NodeList from '../node-list';
import { ShowMenuButton, HideMenuButton } from './menu-buttons';
import './sidebar.css';

/**
 * Main app container. Handles showing/hiding the sidebar nav, and theme classes.
 * @param {Object} props onToggle, theme, and visible
 */
export const Sidebar = props => (
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

const mapStateToProps = state => ({
  theme: state.theme,
  visible: state.visible.sidebar
});

const mapDispatchToProps = dispatch => ({
  onToggle: visible => {
    dispatch(toggleSidebar(visible));
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Sidebar);
