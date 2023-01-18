import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { replaceMatches } from '../../utils';
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
  const { pathname } = window.location;
  const sanitizedPathname = replaceMatches(pathname, {
    'experiment-tracking': '',
  });

  // Reload state is to ensure it will call redirectLocation in FlowchartWrapper
  // only when the page is reloaded.
  const [reload, setReload] = useState(false);

  useEffect(() => setReload(true), []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setReload(false);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

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
              <Route exact path={sanitizedPathname}>
                <FlowChartWrapper reload={reload} />
              </Route>
              <Route path={`${sanitizedPathname}experiment-tracking`}>
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
