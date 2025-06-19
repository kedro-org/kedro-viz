import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import classnames from 'classnames';
import { isRunningLocally, sanitizedPathname } from '../../utils';
import { getVersion } from '../../utils';
import { setView, resetIsLatestRun } from '../../actions';
import FeatureHints from '../feature-hints';
import GlobalToolbar from '../global-toolbar';
import FlowChartWrapper from '../flowchart-wrapper';
import Workflow from '../workflow';
import SettingsModal from '../settings-modal';
import UpdateReminder from '../update-reminder';
import ShareableUrlModal from '../shareable-url-modal';
import { getPipelineRunData } from '../../selectors/run-status';

import './wrapper.scss';
import { VIEW } from '../../config';

/**
 * Main app container. Handles showing/hiding the sidebar nav, and theme classes.
 */
export const Wrapper = ({
  displayGlobalNavigation,
  theme,
  onSetView,
  onResetIsLatestRun,
  runStatusPipelineInfo,
}) => {
  const [isOutdated, setIsOutdated] = useState(false);
  const [latestVersion, setLatestVersion] = useState(null);
  const [version, setVersion] = useState(null);

  useEffect(() => {
    async function checkKedroVizVersion() {
      try {
        const request = await getVersion();
        const response = await request.json();

        if (request.ok) {
          setIsOutdated(response.is_outdated);
          setLatestVersion(response.latest);
          setVersion(response);
        }
      } catch (error) {
        console.error('Error fetching Kedro-Viz version:', error);
      }
    }

    checkKedroVizVersion();
  }, []);

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
          <>
            <GlobalToolbar isOutdated={isOutdated} />
            <SettingsModal
              isOutdated={isOutdated}
              latestVersion={latestVersion}
            />
            {isRunningLocally() ? <ShareableUrlModal /> : null}
            {version && (
              <UpdateReminder isOutdated={isOutdated} version={version} />
            )}
            <Switch>
              <Route
                exact
                path={sanitizedPathname()}
                render={() => {
                  onSetView(VIEW.FLOWCHART);
                  return (
                    <>
                      <FlowChartWrapper />
                      <FeatureHints />
                    </>
                  );
                }}
              />
              <Route
                path={`${sanitizedPathname()}workflow`}
                render={() => {
                  onSetView(VIEW.WORKFLOW);
                  onResetIsLatestRun(runStatusPipelineInfo.endTime);
                  return <Workflow />;
                }}
              />
            </Switch>
          </>
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
  runStatusPipelineInfo: getPipelineRunData(state),
});

export const mapDispatchToProps = (dispatch) => ({
  onSetView: (view) => {
    dispatch(setView(view));
  },
  onResetIsLatestRun: (endTime) => {
    dispatch(resetIsLatestRun(endTime));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(Wrapper);
