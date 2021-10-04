import React from 'react';
import { connect } from 'react-redux';
import { isLoading } from '../../selectors/loading';
import ExportModal from '../export-modal';
import FlowChart from '../flowchart';
import LargePipelineWarning from '../large-pipeline-warning';
import LoadingIcon from '../icons/loading';
import MetaData from '../metadata';
import PlotlyModal from '../plotly-modal';
import SettingsModal from '../settings-modal';
import Sidebar from '../sidebar';
import './flowchart-wrapper.css';

/**
 * Main app container. Handles showing/hiding the sidebar nav, and theme classes.
 */
export const FlowchartWrapper = ({ loading }) => (
  <div className="kedro-pipeline">
    <Sidebar />
    <MetaData />
    <div className="pipeline-wrapper">
      <LargePipelineWarning />
      <FlowChart />
      <LoadingIcon className="pipeline-wrapper__loading" visible={loading} />
    </div>
    <ExportModal />
    <SettingsModal />
    <PlotlyModal />
  </div>
);

export const mapStateToProps = (state) => ({
  loading: isLoading(state),
});

export default connect(mapStateToProps)(FlowchartWrapper);
