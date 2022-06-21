import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { useApolloQuery } from '../../apollo/utils';
import { client } from '../../apollo/config';
import { GraphQLProvider } from '../provider/provider';
import { GET_VERSIONS } from '../../apollo/queries';
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
export const Wrapper = ({ displayGlobalToolbar, theme }) => {
  const { data: versionData } = useApolloQuery(GET_VERSIONS, {
    client,
    skip: !displayGlobalToolbar,
  });
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
    <div
      className={classnames('kedro-pipeline kedro', {
        'kui-theme--dark': theme === 'dark',
        'kui-theme--light': theme === 'light',
      })}
    >
      <h1 className="pipeline-title">Kedro-Viz</h1>
      {displayGlobalToolbar ? (
        <GraphQLProvider>
          <Router>
            <GlobalToolbar isOutdated={isOutdated} />
            <SettingsModal
              isOutdated={isOutdated}
              latestVersion={latestVersion}
            />
            {versionData && isOutdated && !dismissed && (
              <UpdateReminder
                dismissed={dismissed}
                setDismiss={setDismissed}
                versions={versionData.version}
              />
            )}
            <Switch>
              <Route exact path={['/']}>
                <FlowChartWrapper />
              </Route>
              <Route path={['/experiment-tracking']}>
                <ExperimentWrapper />
              </Route>
            </Switch>
          </Router>
        </GraphQLProvider>
      ) : (
        <FlowChartWrapper />
      )}
    </div>
  );
};

export const mapStateToProps = (state) => ({
  displayGlobalToolbar: state.display.globalToolbar,
  theme: state.theme,
});

export default connect(mapStateToProps)(Wrapper);
