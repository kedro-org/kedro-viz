import React, { useState } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import PipelineList from '../pipeline-list';
import NodeList from '../node-list';
import PrimaryToolbar from '../primary-toolbar';
import MiniMapToolbar from '../minimap-toolbar';
import { toggleTypeDisabled } from '../../actions/node-type';
import MiniMap from '../minimap';
import './sidebar.css';

/**
 * Main app container. Handles showing/hiding the sidebar nav, and theme classes.
 * @param {boolean} props.visible Whether the sidebar is open/closed
 */
export const Sidebar = ({ visible, parametersFlag, onToggleTypeDisabled }) => {
  const [pipelineIsOpen, togglePipeline] = useState(false);
  if (parametersFlag) {
    onToggleTypeDisabled('parameters', false);
  }

  return (
    <>
      <div
        className={classnames('pipeline-sidebar', {
          'pipeline-sidebar--visible': visible,
        })}>
        <div className="pipeline-ui">
          <PipelineList onToggleOpen={togglePipeline} />
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

const mapStateToProps = (state) => ({
  visible: state.visible.sidebar,
  parametersFlag: state.flags.parameters,
});

export const mapDispatchToProps = (dispatch) => ({
  onToggleTypeDisabled: (typeID, disabled) => {
    dispatch(toggleTypeDisabled(typeID, disabled));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(Sidebar);
