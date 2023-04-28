import React, { useEffect, useState } from 'react';
import { Transition } from 'react-transition-group';
import { useApolloQuery } from '../../apollo/utils';
import { connect } from 'react-redux';
import { GET_RUNS, GET_RUN_DATA } from '../../apollo/queries';
import { NEW_RUN_SUBSCRIPTION } from '../../apollo/subscriptions';
import Button from '../ui/button';
import Details from '../experiment-tracking/details';
import Sidebar from '../sidebar';
import { HoverStateContextProvider } from '../experiment-tracking/utils/hover-state-context';
import { useGeneratePathnameForExperimentTracking } from '../../utils/hooks/use-generate-pathname';
import { useRedirectLocationInExperimentTracking } from '../../utils/hooks/use-redirect-location';

import './experiment-wrapper.css';

const MAX_NUMBER_COMPARISONS = 2; // 0-based, so three.

const defaultStyle = {
  opacity: 0,
  transition: `opacity .5s ease-in-out`,
};

const transitionStyles = {
  entering: { opacity: 1 },
  entered: { opacity: 1 },
  exiting: { opacity: 0 },
  exited: { opacity: 0 },
};

const ExperimentWrapper = ({ theme }) => {
  const [disableRunSelection, setDisableRunSelection] = useState(false);
  const [enableShowChanges, setEnableShowChanges] = useState(true);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [pinnedRun, setPinnedRun] = useState();
  const [selectedRunData, setSelectedRunData] = useState(null);
  const [showRunDetailsModal, setShowRunDetailsModal] = useState(false);
  const [showRunExportModal, setShowRunExportModal] = useState(false);
  const [showRunPlotsModal, setShowRunPlotsModal] = useState(false);
  const [newRunAdded, setNewRunAdded] = useState(false);
  const [isDisplayingMetrics, setIsDisplayingMetrics] = useState(false);

  // Reload state is to ensure it will call useRedirectLocationInExperimentTracking
  // only when the component is re-rendered or reloaded.
  const [reload, setReload] = useState(false);

  useEffect(() => setReload(true), []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setReload(false);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  const { toExperimentTrackingPath, toSelectedRunsPath } =
    useGeneratePathnameForExperimentTracking();

  // Fetch all runs.
  const { subscribeToMore, data, loading } = useApolloQuery(GET_RUNS);

  const {
    activeTab,
    enableComparisonView,
    errorMessage,
    invalidUrl,
    selectedRunIds,
    setActiveTab,
    setEnableComparisonView,
    setSelectedRunIds,
  } = useRedirectLocationInExperimentTracking(data, reload);

  // Fetch all data for selected runs.
  const {
    data: { runMetadata = [], plots = [], metrics = [], JSONData = [] } = [],
    error: runDataError,
    loading: isRunDataLoading,
  } = useApolloQuery(GET_RUN_DATA, {
    skip: selectedRunIds.length === 0,
    variables: { runIds: selectedRunIds, showDiff: true },
  });

  let runTrackingData = {};

  if (plots.length > 0) {
    runTrackingData['Plots'] = plots;
  } else {
    runTrackingData['Plots'] = [];
  }

  if (metrics.length > 0) {
    runTrackingData['Metrics'] = metrics;
  }

  if (JSONData.length > 0) {
    runTrackingData['JSON Data'] = JSONData;
  }

  const onRunSelection = (id) => {
    if (enableComparisonView) {
      if (selectedRunIds.includes(id)) {
        if (selectedRunIds.length === 1) {
          return;
        }
        const selectedIds = selectedRunIds.filter((run) => run !== id);

        setSelectedRunIds(selectedIds);
        toSelectedRunsPath(selectedIds, activeTab, enableComparisonView);

        setNewRunAdded(false);
      } else {
        setSelectedRunIds([...selectedRunIds, id]);
        setNewRunAdded(true);
        toSelectedRunsPath(
          [...selectedRunIds, id],
          activeTab,
          enableComparisonView
        );
      }
    } else {
      if (selectedRunIds.includes(id)) {
        return;
      } else {
        setSelectedRunIds([id]);
        toSelectedRunsPath([id], activeTab, enableComparisonView);
      }
    }
  };

  const onToggleComparisonView = () => {
    setEnableComparisonView(!enableComparisonView);

    if (selectedRunIds.length === 1) {
      toSelectedRunsPath(
        selectedRunIds.slice(0, 1),
        activeTab,
        !enableComparisonView
      );
    }

    if (enableComparisonView && selectedRunIds.length > 1) {
      setSelectedRunIds(selectedRunIds.slice(0, 1));
      toSelectedRunsPath(
        selectedRunIds.slice(0, 1),
        activeTab,
        !enableComparisonView
      );
    }
  };

  const onTabChangeHandler = (tab) => {
    setActiveTab(tab);
    toSelectedRunsPath(selectedRunIds, tab, enableComparisonView);
  };

  useEffect(() => {
    if (selectedRunIds.length > MAX_NUMBER_COMPARISONS) {
      setDisableRunSelection(true);
    } else {
      setDisableRunSelection(false);
    }
  }, [selectedRunIds]);

  useEffect(() => {
    /**
     * If we return runs and aren't in comparison view, set a single selected
     * run data object for use in the ExperimentPrimaryToolbar component.
     */
    if (data?.runsList.length > 0 && !enableComparisonView) {
      const singleSelectedRunData = data.runsList.filter((run) => {
        return run.id === selectedRunIds[0];
      })[0];

      setSelectedRunData(singleSelectedRunData);
    }
  }, [data, enableComparisonView, selectedRunIds]);

  useEffect(() => {
    if (
      typeof pinnedRun === 'undefined' ||
      !selectedRunIds.includes(pinnedRun)
    ) {
      // Assign the first selected run as the first pinned run.
      setPinnedRun(selectedRunIds[0]);
    }
  }, [selectedRunIds, pinnedRun]);

  useEffect(() => {
    if (!data?.runsList || data.runsList.length === 0) {
      return;
    }

    subscribeToMore({
      document: NEW_RUN_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data || !prev?.runsList) {
          return prev;
        }
        const newRuns = subscriptionData.data.runsAdded;

        return Object.assign({}, prev, {
          runsList: [...newRuns, ...prev.runsList],
        });
      },
    });
  }, [data, subscribeToMore]);

  if (loading) {
    return (
      <div className="experiment-wrapper">
        <p className="experiment-wrapper__text">Loading...</p>
      </div>
    );
  }

  if (invalidUrl) {
    return (
      <div className="experiment-wrapper__error">
        <h2 className="experiment-wrapper__header">
          Oops, this URL isn't valid
        </h2>
        <p className="experiment-wrapper__text">{`${errorMessage}.`}</p>
        <Button onClick={() => toExperimentTrackingPath()}>Reset view</Button>
      </div>
    );
  } else {
    return (
      <>
        <HoverStateContextProvider>
          {data?.runsList.length > 0 ? (
            <>
              <Sidebar
                disableRunSelection={disableRunSelection}
                enableComparisonView={enableComparisonView}
                enableShowChanges={enableShowChanges}
                isDisplayingMetrics={isDisplayingMetrics}
                isExperimentView
                onRunSelection={onRunSelection}
                onToggleComparisonView={onToggleComparisonView}
                runsListData={data.runsList}
                selectedRunData={selectedRunData}
                selectedRunIds={selectedRunIds}
                setEnableShowChanges={setEnableShowChanges}
                setShowRunExportModal={setShowRunExportModal}
                setSidebarVisible={setIsSidebarVisible}
                showRunDetailsModal={setShowRunDetailsModal}
                sidebarVisible={isSidebarVisible}
              />
              <Transition in={selectedRunIds.length > 0} timeout={300}>
                {(state) => (
                  <div
                    style={{
                      ...defaultStyle,
                      ...transitionStyles[state],
                    }}
                  >
                    {selectedRunIds.length > 0 ? (
                      <Details
                        activeTab={activeTab}
                        enableComparisonView={enableComparisonView}
                        enableShowChanges={
                          enableShowChanges && selectedRunIds.length > 1
                        }
                        isRunDataLoading={isRunDataLoading}
                        newRunAdded={newRunAdded}
                        onRunSelection={onRunSelection}
                        pinnedRun={pinnedRun}
                        runDataError={runDataError}
                        runMetadata={runMetadata}
                        runTrackingData={runTrackingData}
                        selectedRunIds={selectedRunIds}
                        setActiveTab={onTabChangeHandler}
                        setIsDisplayingMetrics={setIsDisplayingMetrics}
                        setPinnedRun={setPinnedRun}
                        setShowRunDetailsModal={setShowRunDetailsModal}
                        setShowRunExportModal={setShowRunExportModal}
                        setShowRunPlotsModal={setShowRunPlotsModal}
                        showRunDetailsModal={showRunDetailsModal}
                        showRunExportModal={showRunExportModal}
                        showRunPlotsModal={showRunPlotsModal}
                        sidebarVisible={isSidebarVisible}
                        theme={theme}
                      />
                    ) : null}
                  </div>
                )}
              </Transition>
            </>
          ) : (
            <Transition in={data?.runsList.length <= 0} timeout={300}>
              {(state) => (
                <div
                  className="experiment-wrapper"
                  style={{
                    ...defaultStyle,
                    ...transitionStyles[state],
                  }}
                >
                  <h2 className="experiment-wrapper__header">
                    You don't have any experiments
                  </h2>
                  <p className="experiment-wrapper__text">
                    Kedro can help you manage your experiments. Learn more how
                    you can enable experiment tracking in your projects from our
                    docs.{' '}
                  </p>
                  <a
                    href="https://docs.kedro.org/en/stable/visualisation/experiment_tracking.html"
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Button>View docs</Button>
                  </a>
                </div>
              )}
            </Transition>
          )}
        </HoverStateContextProvider>
      </>
    );
  }
};

export const mapStateToProps = (state) => ({
  theme: state.theme,
});

export default connect(mapStateToProps)(ExperimentWrapper);
