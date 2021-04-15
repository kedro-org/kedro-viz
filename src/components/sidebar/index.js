import React, { useState } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import PipelineList from '../pipeline-list';
import NodeList from '../node-list';
import PrimaryToolbar from '../primary-toolbar';
import MiniMapToolbar from '../minimap-toolbar';
import MiniMap from '../minimap';
import { toggleModularPipelineContracted } from '../../actions/modular-pipelines';
import './sidebar.css';

/**
 * Main app container. Handles showing/hiding the sidebar nav, and theme classes.
 * @param {boolean} props.visible Whether the sidebar is open/closed
 */
export const Sidebar = ({
  modularPipeline,
  visible,
  onToggleModularPipelineContracted,
}) => {
  const [pipelineIsOpen, togglePipeline] = useState(false);
  return (
    <>
      <div
        className={classnames('pipeline-sidebar', {
          'pipeline-sidebar--visible': visible,
        })}>
        <div className="pipeline-ui">
          <PipelineList onToggleOpen={togglePipeline} />
          {modularPipeline.ids.map((id) => (
            <button
              key={id}
              onClick={() =>
                onToggleModularPipelineContracted(
                  id,
                  !modularPipeline.contracted[id]
                )
              }>
              {modularPipeline.name[id]}{' '}
              {String(Boolean(modularPipeline.contracted[id]))}
            </button>
          ))}
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

export const mapDispatchToProps = (dispatch) => ({
  onToggleModularPipelineContracted: (id, contracted) => {
    dispatch(toggleModularPipelineContracted(id, contracted));
  },
});

const mapStateToProps = (state) => ({
  visible: state.visible.sidebar,
  modularPipeline: state.modularPipeline,
});

export default connect(mapStateToProps, mapDispatchToProps)(Sidebar);
