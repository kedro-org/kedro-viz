import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import PipelineList from '../pipeline-list';
import TagList from '../tag-list';
import NodeList from '../node-list';
import PrimaryToolbar from '../primary-toolbar';
import MiniMapToolbar from '../minimap-toolbar';
import MiniMap from '../minimap';
import './sidebar.css';

/**
 * Main app container. Handles showing/hiding the sidebar nav, and theme classes.
 * @param {Object} props visible
 */
export const Sidebar = ({ flags, visible }) => (
  <>
    <div
      className={classnames('pipeline-sidebar', {
        'pipeline-sidebar--visible': visible
      })}>
      <div className="pipeline-ui">
        {flags.pipelines && <PipelineList />}
        <TagList />
        <NodeList />
      </div>
      <nav className="pipeline-toolbar">
        <PrimaryToolbar />
        <MiniMapToolbar />
      </nav>
      <MiniMap />
    </div>
  </>
);

const mapStateToProps = state => ({
  flags: state.flags,
  visible: state.visible.sidebar
});

export default connect(mapStateToProps)(Sidebar);
