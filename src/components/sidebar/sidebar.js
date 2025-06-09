import React, { useState } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import FlowchartPrimaryToolbar from '../flowchart-primary-toolbar';
import MiniMap from '../minimap';
import MiniMapToolbar from '../minimap-toolbar';
import NodesPanel from '../nodes-panel';
import PipelineList from '../pipeline-list';
import ToolbarFilterButton from '../toolbar-filter-button';
import { VIEW } from '../../config';

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
}) => {
  const [pipelineIsOpen, togglePipeline] = useState(false);
  const isFlowchartView = view === VIEW.FLOWCHART;
  const isWorkflowView = view === VIEW.WORKFLOW;

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
            isWorkFlowView={isWorkflowView}
          />
          <NodesPanel faded={pipelineIsOpen} />
        </div>
        <nav className="pipeline-toolbar">
          {displayFilterBtn && <ToolbarFilterButton />}
          <FlowchartPrimaryToolbar isFlowchartView={isFlowchartView} />
          <MiniMapToolbar />
        </nav>
        <MiniMap />
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
});

export default connect(mapStateToProps)(Sidebar);
