import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { isLoading } from '../../selectors/loading';
import {
  getModularPipelinesTree,
  getNodeFullName,
} from '../../selectors/nodes';
import { getVisibleMetaSidebar } from '../../selectors/metadata';
import {
  toggleModularPipelineActive,
  toggleModularPipelinesExpanded,
} from '../../actions/modular-pipelines';
import { toggleFocusMode } from '../../actions';
import { loadNodeData } from '../../actions/nodes';
import { loadPipelineData } from '../../actions/pipelines';
import ExportModal from '../export-modal';
import FlowChart from '../flowchart-copy';
import LoadingIcon from '../icons/loading';
import MetaData from '../metadata';
import MetadataModal from '../metadata-modal';
import Sidebar from '../sidebar';

/**
 * Main flowchart container. Handles showing/hiding the sidebar nav for flowchart view,
 * the rendering of the flowchart, as well as the display of all related modals.
 */
export const WorkflowWrapper = ({
  fullNodeNames,
  displaySidebar,
  graph,
  loading,
  modularPipelinesTree,
  nodes,
  onToggleFocusMode,
  onToggleModularPipelineActive,
  onToggleModularPipelineExpanded,
  onToggleNodeSelected,
  onUpdateActivePipeline,
  pipelines,
  sidebarVisible,
  activePipeline,
  tag,
  nodeType,
  expandAllPipelines,
  displayMetadataPanel,
  displayExportBtn,
  displayBanner,
}) => {
  return (
    <div className="kedro-pipeline">
      {displaySidebar && <Sidebar />}
      {displayMetadataPanel && <MetaData />}

      <div className="pipeline-wrapper">
        <FlowChart />
        <div
          className={classnames('pipeline-wrapper__loading', {
            'pipeline-wrapper__loading--sidebar-visible': sidebarVisible,
          })}
        >
          <LoadingIcon visible={loading} />
        </div>
      </div>
      {displayExportBtn && <ExportModal />}
      <MetadataModal />
    </div>
  );
};

export const mapStateToProps = (state) => ({
  fullNodeNames: getNodeFullName(state),
  displaySidebar: state.display.sidebar,
  graph: state.graph,
  loading: isLoading(state),
  metadataVisible: getVisibleMetaSidebar(state),
  modularPipelinesTree: getModularPipelinesTree(state),
  nodes: state.node.modularPipelines,
  pipelines: state.pipeline.ids,
  activePipeline: state.pipeline.active,
  sidebarVisible: state.visible.sidebar,
  tag: state.tag.enabled,
  nodeType: state.nodeType.disabled,
  expandAllPipelines: state.expandAllPipelines,
  displayMetadataPanel: state.display.metadataPanel,
  displayExportBtn: state.display.exportBtn,
  displayBanner: state.showBanner,
});

export const mapDispatchToProps = (dispatch) => ({
  onToggleFocusMode: (modularPipeline) => {
    dispatch(toggleFocusMode(modularPipeline));
  },
  onToggleNodeSelected: (nodeID) => {
    dispatch(loadNodeData(nodeID));
  },
  onToggleModularPipelineActive: (modularPipelineIDs, active) => {
    dispatch(toggleModularPipelineActive(modularPipelineIDs, active));
  },
  onToggleModularPipelineExpanded: (expanded) => {
    dispatch(toggleModularPipelinesExpanded(expanded));
  },
  onUpdateActivePipeline: (pipelineId) => {
    dispatch(loadPipelineData(pipelineId));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(WorkflowWrapper);
