import React from 'react';
import { connect } from 'react-redux';
import { isLoading } from '../../selectors/loading';
import classnames from 'classnames';
import GlobalToolbar from '../global-toolbar';
import FlowchartWrapper from '../flowchart-wrapper';
import './wrapper.css';

/**
 * Main app container. Handles showing/hiding the sidebar nav, and theme classes.
 */
export const Wrapper = ({ loading, theme }) => (
  <div
    className={classnames('kedro', {
      'kui-theme--dark': theme === 'dark',
      'kui-theme--light': theme === 'light',
    })}>
    <h1 className="pipeline-title">Kedro-Viz</h1>
    <GlobalToolbar />
    <FlowchartWrapper />
  </div>
);

export const mapStateToProps = (state) => ({
  loading: isLoading(state),
  theme: state.theme,
});

export default connect(mapStateToProps)(Wrapper);
