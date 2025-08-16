import React, { useState } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import FlowchartPrimaryToolbar from '../flowchart-primary-toolbar';
import RunnerPrimaryToolbar from '../runner-primary-toolbar';
import MiniMap from '../minimap';
import MiniMapToolbar from '../minimap-toolbar';
import NodesPanel from '../nodes-panel';
import PipelineList from '../pipeline-list';
import ToolbarFilterButton from '../toolbar-filter-button';
import { VIEW } from '../../config';
import { isRunStatusAvailable } from '../../selectors/run-status';

import './sidebar.scss';

/**
 * Main app container. Handles showing/hiding the sidebar nav, and theme classes.
 * @param {Boolean} props.visible Whether the sidebar is open/closed
 */
export const Sidebar = ({
  displayGlobalNavigation,
  visible,
  displayFilterBtn,
  view,
  isRunStatusAvailable,
  // New optional prop: when true, hide minimap and its toolbar (used by Runner page)
  disableMinimap = false,
  // New optional prop: hide the filter button (used by Runner)
  disableFilterButton = false,
}) => {
  const [pipelineIsOpen, togglePipeline] = useState(false);
  const isFlowchartView = view === VIEW.FLOWCHART;
  const isWorkflowView = view === VIEW.WORKFLOW;
  const showMinimap = !disableMinimap && (isFlowchartView || isWorkflowView);
  const hideToolbarButtons = disableMinimap
    ? { labels: true, layers: true, orientation: true, expandPipelines: true }
    : {};

  return (
    <>
      <div
        className={classnames('pipeline-sidebar', {
          'pipeline-sidebar--visible': visible,
          'pipeline-sidebar--no-global-toolbar': !displayGlobalNavigation,
        })}
      >
        <div className="pipeline-ui">
          <PipelineList
            onToggleOpen={togglePipeline}
            isWorkflowView={isWorkflowView}
          />
          <NodesPanel
            // Show the node panel data only if we are not in flowchart view or if we are in workflow view but run status is not available
            visible={
              !isWorkflowView || (isWorkflowView && isRunStatusAvailable)
            }
            faded={pipelineIsOpen}
          />
        </div>
        <nav className="pipeline-toolbar">
          {displayFilterBtn && !disableFilterButton && <ToolbarFilterButton />}
          {disableMinimap ? (
            <RunnerPrimaryToolbar />
          ) : (
            <FlowchartPrimaryToolbar
              isFlowchartView={isFlowchartView}
              hideButtons={hideToolbarButtons}
            />
          )}
          {showMinimap && <MiniMapToolbar />}
        </nav>
        {showMinimap && <MiniMap />}
      </div>
    </>
  );
};

const mapStateToProps = (state) => ({
  displayGlobalNavigation: state.display.globalNavigation,
  displaySidebar: state.display.sidebar,
  displayFilterBtn: state.display.filterBtn,
  visible: state.visible.sidebar,
  view: state.view,
  isRunStatusAvailable: isRunStatusAvailable(state),
});

export default connect(mapStateToProps)(Sidebar);
