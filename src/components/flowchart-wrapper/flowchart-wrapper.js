import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { isLoading } from '../../selectors/loading';
import { getModularPipelinesTree } from '../../selectors/nodes';
import { toggleModularPipelineActive } from '../../actions/modular-pipelines';
import { toggleFocusMode } from '../../actions';
import { toggleModularPipelinesExpanded } from '../../actions/modular-pipelines';
import ExportModal from '../export-modal';
import FlowChart from '../flowchart';
import PipelineWarning from '../pipeline-warning';
import LoadingIcon from '../icons/loading';
import MetaData from '../metadata';
import MetadataModal from '../metadata-modal';
import { loadNodeData } from '../../actions/nodes';
import Sidebar from '../sidebar';
import { useRedirectLocation } from '../../utils/hooks/use-redirect-location';
import './flowchart-wrapper.css';

/**
 * Main flowchart container. Handles showing/hiding the sidebar nav for flowchart view,
 * the rendering of the flowchart, as well as the display of all related modals.
 */
export const FlowChartWrapper = ({
  loading,
  modularPipelinesTree,
  onLoadNodeData,
  onToggleFocusMode,
  onToggleModularPipelineActive,
  onToggleModularPipelineExpanded,
  sidebarVisible,
}) => {
  useRedirectLocation(
    modularPipelinesTree,
    onLoadNodeData,
    onToggleFocusMode,
    onToggleModularPipelineActive,
    onToggleModularPipelineExpanded
  );

  return (
    <div className="kedro-pipeline">
      <Sidebar />
      <MetaData />
      <div className="pipeline-wrapper">
        <PipelineWarning />
        <FlowChart />
        <div
          className={classnames('pipeline-wrapper__loading', {
            'pipeline-wrapper__loading--sidebar-visible': sidebarVisible,
          })}
        >
          <LoadingIcon visible={loading} />
        </div>
      </div>
      <ExportModal />
      <MetadataModal />
    </div>
  );
};

export const mapStateToProps = (state) => ({
  loading: isLoading(state),
  modularPipelinesTree: getModularPipelinesTree(state),
  sidebarVisible: state.visible.sidebar,
});

export const mapDispatchToProps = (dispatch) => ({
  onToggleFocusMode: (modularPipeline) => {
    dispatch(toggleFocusMode(modularPipeline));
  },
  onLoadNodeData: (nodeClicked) => {
    dispatch(loadNodeData(nodeClicked));
  },
  onToggleModularPipelineActive: (modularPipelineIDs, active) => {
    dispatch(toggleModularPipelineActive(modularPipelineIDs, active));
  },
  onToggleModularPipelineExpanded: (expanded) => {
    dispatch(toggleModularPipelinesExpanded(expanded));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(FlowChartWrapper);
