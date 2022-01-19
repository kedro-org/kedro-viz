import React, { useState } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import ExperimentPrimaryToolbar from '../experiment-tracking/experiment-primary-toolbar';
import FlowchartPrimaryToolbar from '../flowchart-primary-toolbar';
import MiniMap from '../minimap';
import MiniMapToolbar from '../minimap-toolbar';
import NodeList from '../node-list';
import PipelineList from '../pipeline-list';
import RunsList from '../experiment-tracking/runs-list';
import Switch from '../switch';

import './sidebar.css';

/**
 * Main app container. Handles showing/hiding the sidebar nav, and theme classes.
 * @param {boolean} props.visible Whether the sidebar is open/closed
 */
export const Sidebar = ({
  disableRunSelection,
  enableComparisonView,
  enableShowChanges,
  isExperimentView = false,
  onRunSelection,
  onToggleComparisonView,
  runsListData,
  selectedRunData,
  selectedRunIds,
  setEnableShowChanges,
  setSidebarVisible,
  showRunDetailsModal,
  sidebarVisible,
  visible,
}) => {
  const [pipelineIsOpen, togglePipeline] = useState(false);

  if (isExperimentView) {
    return (
      <>
        <div
          className={classnames('pipeline-sidebar', {
            'pipeline-sidebar--visible': sidebarVisible,
          })}
        >
          <div className="pipeline-ui pipeline-ui--experiment-tracking">
            <div className="compare-switch-wrapper">
              <span className="compare-switch-wrapper__text">
                Compare runs (max. 3)
              </span>
              <Switch onChange={onToggleComparisonView} />
            </div>
            <RunsList
              disableRunSelection={disableRunSelection}
              enableComparisonView={enableComparisonView}
              onRunSelection={onRunSelection}
              runData={runsListData}
              selectedRunIds={selectedRunIds}
            />
          </div>
          <nav className="pipeline-toolbar">
            <ExperimentPrimaryToolbar
              enableComparisonView={enableComparisonView}
              enableShowChanges={enableShowChanges}
              selectedRunData={selectedRunData}
              setEnableShowChanges={setEnableShowChanges}
              setSidebarVisible={setSidebarVisible}
              showChangesIconDisabled={!(selectedRunIds.length > 1)}
              showRunDetailsModal={showRunDetailsModal}
              sidebarVisible={sidebarVisible}
            />
          </nav>
        </div>
      </>
    );
  } else {
    return (
      <>
        <div
          className={classnames('pipeline-sidebar', {
            'pipeline-sidebar--visible': visible,
          })}
        >
          <div className="pipeline-ui">
            <PipelineList onToggleOpen={togglePipeline} />
            <NodeList faded={pipelineIsOpen} />
          </div>
          <nav className="pipeline-toolbar">
            <FlowchartPrimaryToolbar />
            <MiniMapToolbar />
          </nav>
          <MiniMap />
        </div>
      </>
    );
  }
};

const mapStateToProps = (state) => ({
  visible: state.visible.sidebar,
});

export default connect(mapStateToProps)(Sidebar);
