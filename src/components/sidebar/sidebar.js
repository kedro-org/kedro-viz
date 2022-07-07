import React, { useState, useEffect } from 'react';
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
  displaySidebar,
  enableComparisonView,
  enableShowChanges,
  isExperimentView = false,
  onRunSelection,
  onToggleComparisonView,
  runMetadata,
  runsListData,
  runTrackingData,
  selectedRunData,
  selectedRunIds,
  setEnableShowChanges,
  setSidebarVisible,
  showRunDetailsModal,
  sidebarVisible,
  visible,
  setShowRunExportModal,
}) => {
  const [pipelineIsOpen, togglePipeline] = useState(false);
  const [toolbarOverflowVisible, setToolbarOverflowVisible] = useState(false);

  // HACK: to ensure it always resets to overflow:visible whenever enableComparisonView is changed
  // CONTEXT: currently pipeline - toolbar has the overflow: hidden as a default
  // it is to allow the buttons sliding in and out when toggle the comparision view
  // but this makes the tooltip to be hidden too.
  useEffect(() => {
    const setVisibleState = setTimeout(() => {
      setToolbarOverflowVisible(true);
    }, 200);

    return () => {
      clearTimeout(setVisibleState);
    };
  }, [enableComparisonView]);

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
              onToggleComparisonView={() => {
                onToggleComparisonView();
                setToolbarOverflowVisible(false);
              }}
              runData={runsListData}
              selectedRunIds={selectedRunIds}
            />
          </div>
          <nav
            className={classnames('pipeline-toolbar', {
              'pipeline-toolbar--visible': toolbarOverflowVisible,
            })}
          >
            <ExperimentPrimaryToolbar
              displaySidebar={displaySidebar}
              enableComparisonView={enableComparisonView}
              enableShowChanges={enableShowChanges}
              runMetadata={runMetadata}
              runTrackingData={runTrackingData}
              selectedRunData={selectedRunData}
              setEnableShowChanges={setEnableShowChanges}
              setSidebarVisible={setSidebarVisible}
              showChangesIconDisabled={!(selectedRunIds.length > 1)}
              showRunDetailsModal={showRunDetailsModal}
              sidebarVisible={sidebarVisible}
              setShowRunExportModal={setShowRunExportModal}
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
  displayGlobalToolbar: state.display.globalToolbar,
  displaySidebar: state.display.sidebar,
  visible: state.visible.sidebar,
});

export default connect(mapStateToProps)(Sidebar);
