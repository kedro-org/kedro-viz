import React from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import FlowChart from '../flowchart';
import Sidebar from '../sidebar';
import IconToolbar from '../icon-toolbar';
import './wrapper.css';

/**
 * Main app container. Handles showing/hiding the sidebar nav, and theme classes.
 */
export const Wrapper = ({ fontLoaded, theme }) => (
  <div
    className={classnames('kedro-pipeline', {
      'kui-theme--dark': theme === 'dark',
      'kui-theme--light': theme === 'light'
    })}>
    <Sidebar />
    {fontLoaded && <IconToolbar />}
    <div className="pipeline-wrapper">{fontLoaded && <FlowChart />}</div>
  </div>
);

export const mapStateToProps = state => ({
  fontLoaded: state.fontLoaded,
  theme: state.theme
});

export default connect(mapStateToProps)(Wrapper);
