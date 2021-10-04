import React from 'react';
import { connect } from 'react-redux';
import { isLoading } from '../../selectors/loading';
import classnames from 'classnames';
import ExportModal from '../export-modal';
import FlowChart from '../flowchart';
import GlobalToolbar from '../global-toolbar';
import LargePipelineWarning from '../large-pipeline-warning';
import LoadingIcon from '../icons/loading';
import MetaData from '../metadata';
import PlotlyModal from '../plotly-modal';
import SettingsModal from '../settings-modal';
import Sidebar from '../sidebar';
import './wrapper.css';

/**
 * Main app container. Handles showing/hiding the sidebar nav, and theme classes.
 */
export const Wrapper = ({ loading, theme }) => (
  <div
    className={classnames('kedro-pipeline kedro', {
      'kui-theme--dark': theme === 'dark',
      'kui-theme--light': theme === 'light',
    })}
  >
    <h1 className="pipeline-title">Kedro-Viz</h1>
    <GlobalToolbar />
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
  theme: state.theme,
});

export default connect(mapStateToProps)(Wrapper);
