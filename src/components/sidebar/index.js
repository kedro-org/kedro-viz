import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import TagList from '../tag-list';
import NodeList from '../node-list';
import IconToolbar from '../icon-toolbar';
import MiniMap from '../minimap';
import './sidebar.css';

/**
 * Main app container. Handles showing/hiding the sidebar nav, and theme classes.
 * @param {Object} props visible
 */
export const Sidebar = ({ visible, miniMapVisible }) => (
  <>
    <div
      className={classnames('pipeline-sidebar', {
        'pipeline-sidebar--visible': visible
      })}>
      <div className="pipeline-ui">
        <TagList />
        <NodeList />
      </div>
      <IconToolbar />
      <div
        className={classnames('pipeline-minimap-container', {
          'pipeline-minimap-container--visible': miniMapVisible
        })}>
        <MiniMap />
      </div>
    </div>
  </>
);

const mapStateToProps = state => ({
  visible: state.visible.sidebar,
  miniMapVisible: state.visible.miniMap
});

export default connect(mapStateToProps)(Sidebar);
