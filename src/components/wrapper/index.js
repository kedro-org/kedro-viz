import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import Modal from '../large-pipeline-warning';
import FlowChart from '../flowchart';
import Sidebar from '../sidebar';
import MetaData from '../metadata';
import ExportModal from '../export-modal';
import LoadingIcon from '../icons/loading';
import { isLoading } from '../../selectors/loading';
import { getShouldDisplayLargeWarning } from '../../selectors/layout';
import './wrapper.css';

/**
 * Main app container. Handles showing/hiding the sidebar nav, and theme classes.
 */
export const Wrapper = ({ loading, theme, showLargeGraphWarning }) => (
  <div
    className={classnames('kedro-pipeline', {
      'kui-theme--dark': theme === 'dark',
      'kui-theme--light': theme === 'light'
    })}>
    <h1 className="pipeline-title">Kedro-Viz</h1>
    <Sidebar />
    <MetaData />
    <div className="pipeline-wrapper">
      {showLargeGraphWarning ? <Modal /> : <FlowChart />}
      <LoadingIcon className="pipeline-wrapper__loading" visible={loading} />
    </div>
    <ExportModal />
  </div>
);

export const mapStateToProps = state => ({
  loading: isLoading(state),
  theme: state.theme,
  showLargeGraphWarning: getShouldDisplayLargeWarning(state)
});

export default connect(mapStateToProps)(Wrapper);
