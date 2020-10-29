import React, { useState } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import PipelineList from '../pipeline-list';
import NodeList from '../node-list';
import PrimaryToolbar from '../primary-toolbar';
import MiniMapToolbar from '../minimap-toolbar';
import MiniMap from '../minimap';
import './sidebar.css';

/**
 * Main app container. Handles showing/hiding the sidebar nav, and theme classes.
 * @param {object} props.flags Feature flags from URL/localStorage
 * @param {boolean} props.visible Whether the sidebar is open/closed
 */
export const Sidebar = ({ flags, visible }) => {
  const [pipelineIsOpen, togglePipeline] = useState(false);

  return (
    <>
      <div
        className={classnames('pipeline-sidebar', {
          'pipeline-sidebar--visible': visible
        })}>
        <div className="pipeline-ui">
          {flags.pipelines && <PipelineList onToggleOpen={togglePipeline} />}
          <NodeList faded={pipelineIsOpen} />
        </div>
        <nav className="pipeline-toolbar">
          <PrimaryToolbar />
          <MiniMapToolbar />
        </nav>
        <MiniMap />
      </div>
    </>
  );
};

const mapStateToProps = state => ({
  flags: state.flags,
  visible: state.visible.sidebar
});

export default connect(mapStateToProps)(Sidebar);
