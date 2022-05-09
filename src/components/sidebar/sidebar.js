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

import './sidebar.css';

/**
 * Main app container. Handles showing/hiding the sidebar nav, and theme classes.
 * @param {boolean} props.visible Whether the sidebar is open/closed
 */
export const Sidebar = ({
  disableRunSelection,
  displayGlobalToolbar,
  enableComparisonView,
  enableShowChanges,
  isExperimentView = false,
  onRunSelection,
  onToggleComparisonView,
  runsListData,
  runMetadata,
  runTrackingData,
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
            <RunsList
              disableRunSelection={disableRunSelection}
              enableComparisonView={enableComparisonView}
              onRunSelection={onRunSelection}
              runData={runsListData}
              selectedRunIds={selectedRunIds}
              onToggleComparisonView={onToggleComparisonView}
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
              runMetadata={runMetadata}
              runTrackingData={runTrackingData}
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
            'pipeline-sidebar--no-global-toolbar': !displayGlobalToolbar,
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
  displayGlobalToolbar: state.display.globalToolbar,
});

export default connect(mapStateToProps)(Sidebar);
