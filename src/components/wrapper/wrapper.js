import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import classnames from 'classnames';
import { isRunningLocally, sanitizedPathname } from '../../utils';
import { useApolloQuery } from '../../apollo/utils';
import { client } from '../../apollo/config';
import { GraphQLProvider } from '../provider/provider';
import { GET_VERSIONS } from '../../apollo/queries';
import { localStorageDeprecationBannerSeen } from '../../config';
import { loadLocalStorage } from '../../store/helpers';

import FeatureHints from '../feature-hints';
import GlobalToolbar from '../global-toolbar';
import FlowChartWrapper from '../flowchart-wrapper';
import ExperimentWrapper from '../experiment-wrapper';
import SettingsModal from '../settings-modal';
import UpdateReminder from '../update-reminder';
import ShareableUrlModal from '../shareable-url-modal';
import { DeprecationBanner } from '../deprecation-banner/deprecation-banner';

import './wrapper.scss';

/**
 * Main app container. Handles showing/hiding the sidebar nav, and theme classes.
 */
export const Wrapper = ({ displayGlobalNavigation, theme }) => {
  const { data: versionData } = useApolloQuery(GET_VERSIONS, {
    client,
    skip: !displayGlobalNavigation || !isRunningLocally(),
  });
  const [isOutdated, setIsOutdated] = useState(false);
  const [latestVersion, setLatestVersion] = useState(null);
  const [showDeprecationBannerForET, setShowDeprecationBannerForET] =
    useState(false);

  useEffect(() => {
    if (versionData) {
      setIsOutdated(versionData.version.isOutdated);
      setLatestVersion(versionData.version.latest);
    }
  }, [versionData]);

  useEffect(() => {
    const bannerSeen = loadLocalStorage(localStorageDeprecationBannerSeen);
    const shouldShowBanner =
      bannerSeen['experiment-tracking'] === undefined ||
      bannerSeen['experiment-tracking'] === false;
    setShowDeprecationBannerForET(shouldShowBanner);
  }, []);

  console.log(showDeprecationBannerForET, 'showDeprecationBannerForET');
  return (
    <div
      className={classnames('kedro-pipeline kedro', {
        'kui-theme--dark': theme === 'dark',
        'kui-theme--light': theme === 'light',
      })}
    >
      <h1 className="pipeline-title">Kedro-Viz</h1>
      <Router>
        {displayGlobalNavigation ? (
          <GraphQLProvider>
            <GlobalToolbar isOutdated={isOutdated} />
            <SettingsModal
              isOutdated={isOutdated}
              latestVersion={latestVersion}
            />
            {isRunningLocally() ? <ShareableUrlModal /> : null}
            {showDeprecationBannerForET ? (
              <DeprecationBanner visible={showDeprecationBannerForET} />
            ) : null}
            {versionData && (
              <UpdateReminder
                isOutdated={isOutdated}
                versions={versionData.version}
              />
            )}
            <Switch>
              <Route exact path={sanitizedPathname()}>
                <FlowChartWrapper />
                <FeatureHints />
              </Route>
              <Route path={`${sanitizedPathname()}experiment-tracking`}>
                <ExperimentWrapper />
              </Route>
            </Switch>
          </GraphQLProvider>
        ) : (
          <FlowChartWrapper />
        )}
      </Router>
    </div>
  );
};

export const mapStateToProps = (state) => ({
  displayGlobalNavigation: state.display.globalNavigation,
  theme: state.theme,
});

export default connect(mapStateToProps)(Wrapper);
