import React from 'react';
import { connect } from 'react-redux';
import { isLoading } from '../../selectors/loading';
import ExportModal from '../export-modal';
import FlowChart from '../flowchart';
import PipelineWarning from '../pipeline-warning';
import LoadingIcon from '../icons/loading';
import MetaData from '../metadata';
import MetadataModal from '../metadata-modal';
import Sidebar from '../sidebar';
import './flowchart-wrapper.css';

/**
 * Main flowchart container. Handles showing/hiding the sidebar nav for flowchart view,
 * the rendering of the flowchart, as well as the display of all related modals.
 */
export const FlowChartWrapper = ({ loading }) => (
  <div className="kedro-pipeline">
    <Sidebar />
    <MetaData />
    <div className="pipeline-wrapper">
      <PipelineWarning />
      <FlowChart />
      <LoadingIcon className="pipeline-wrapper__loading" visible={loading} />
    </div>
    <ExportModal />
    <MetadataModal />
  </div>
);

export const mapStateToProps = (state) => ({
  loading: isLoading(state),
});

export default connect(mapStateToProps)(FlowChartWrapper);
