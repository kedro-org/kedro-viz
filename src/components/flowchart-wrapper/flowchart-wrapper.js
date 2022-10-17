import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { isLoading } from '../../selectors/loading';
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
  sidebarVisible,
  onLoadNodeData,
}) => {
  useRedirectLocation(onLoadNodeData);

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
  sidebarVisible: state.visible.sidebar,
});

export const mapDispatchToProps = (dispatch) => ({
  onLoadNodeData: (nodeClicked) => {
    dispatch(loadNodeData(nodeClicked));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(FlowChartWrapper);
