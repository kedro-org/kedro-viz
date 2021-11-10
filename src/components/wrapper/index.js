import React from 'react';
import { connect } from 'react-redux';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { isLoading } from '../../selectors/loading';
import classnames from 'classnames';
import GlobalToolbar from '../global-toolbar';
import FlowChartWrapper from '../flowchart-wrapper';
import ExperimentWrapper from '../experiment-wrapper';
import SettingsModal from '../settings-modal';
import { Provider } from '../provider/provider';

import './wrapper.css';

/**
 * Main app container. Handles showing/hiding the sidebar nav, and theme classes.
 */
export const Wrapper = ({ theme }) => (
  <Provider useMocks={false}>
    <div
      className={classnames('kedro-pipeline kedro', {
        'kui-theme--dark': theme === 'dark',
        'kui-theme--light': theme === 'light',
      })}
    >
      <h1 className="pipeline-title">Kedro-Viz</h1>
      <Router>
        <GlobalToolbar />
        <SettingsModal />
        <Switch>
          <Route exact path={['/', '/flowchart']}>
            <FlowChartWrapper />
          </Route>
          <Route path={['/runsList', '/runsList/:id']}>
            <ExperimentWrapper />
          </Route>
        </Switch>
      </Router>
    </div>
  </Provider>
);

export const mapStateToProps = (state) => ({
  loading: isLoading(state),
  theme: state.theme,
});

export default connect(mapStateToProps)(Wrapper);
