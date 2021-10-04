import React from 'react';
import { connect } from 'react-redux';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import { isLoading } from '../../selectors/loading';
import classnames from 'classnames';
import GlobalToolbar from '../global-toolbar';
import FlowchartWrapper from '../flowchart-wrapper';
import ExperimentWrapper from '../experiment-wrapper';
import SettingsModal from '../settings-modal';
import './wrapper.css';

/**
 * Main app container. Handles showing/hiding the sidebar nav, and theme classes.
 */
export const Wrapper = ({ loading, theme }) => (
  <div
    className={classnames('kedro-pipeline kedro', {
      'kui-theme--dark': theme === 'dark',
      'kui-theme--light': theme === 'light',
    })}>
    <h1 className="pipeline-title">Kedro-Viz</h1>
    <GlobalToolbar />
    <SettingsModal />
    <Router>
      <Switch>
        <Route exact path={['/', '/flowchart']}>
          <FlowchartWrapper />
        </Route>
        <Route path="/experiment">
          <ExperimentWrapper />
        </Route>
      </Switch>
    </Router>
  </div>
);

export const mapStateToProps = (state) => ({
  loading: isLoading(state),
  theme: state.theme,
});

export default connect(mapStateToProps)(Wrapper);
