import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { useApolloQuery } from '../../apollo/utils';
import { client } from '../../apollo/config';
import { GraphQLProvider } from '../provider/provider';
import { GET_VERSIONS } from '../../apollo/queries';
import { isLoading } from '../../selectors/loading';
import classnames from 'classnames';
import GlobalToolbar from '../global-toolbar';
import FlowChartWrapper from '../flowchart-wrapper';
import ExperimentWrapper from '../experiment-wrapper';
import SettingsModal from '../settings-modal';
import UpdateReminder from '../update-reminder';

import './wrapper.css';

/**
 * Main app container. Handles showing/hiding the sidebar nav, and theme classes.
 */
export const Wrapper = ({ theme }) => {
  const { data: versionData } = useApolloQuery(GET_VERSIONS, { client });
  const [dismissed, setDismissed] = useState(false);
  const [isOutdated, setIsOutdated] = useState(false);
  const [latestVersion, setLatestVersion] = useState(null);

  useEffect(() => {
    if (versionData) {
      setIsOutdated(versionData.version.isOutdated);
      setLatestVersion(versionData.version.latest);
    }
  }, [versionData]);

  return (
    <GraphQLProvider useMocks={false}>
      <div
        className={classnames('kedro-pipeline kedro', {
          'kui-theme--dark': theme === 'dark',
          'kui-theme--light': theme === 'light',
        })}
      >
        <h1 className="pipeline-title">Kedro-Viz</h1>
        <Router>
          <GlobalToolbar isOutdated={isOutdated} />
          <SettingsModal
            isOutdated={isOutdated}
            latestVersion={latestVersion}
          />
          {versionData && isOutdated && !dismissed && (
            <UpdateReminder
              dismissed={dismissed}
              versions={versionData.version}
              setDismiss={setDismissed}
            />
          )}
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
    </GraphQLProvider>
  );
};

export const mapStateToProps = (state) => ({
  loading: isLoading(state),
  theme: state.theme,
});

export default connect(mapStateToProps)(Wrapper);
