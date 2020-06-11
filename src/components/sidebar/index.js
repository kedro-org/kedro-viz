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
export const Sidebar = ({ visible }) => (
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
      <div className="minimap-container">
        <MiniMap
          mapSize={{
            width: 240,
            height: 160
          }}
        />
      </div>
    </div>
  </>
);

const mapStateToProps = state => ({
  visible: state.visible.sidebar
});

export default connect(mapStateToProps)(Sidebar);
