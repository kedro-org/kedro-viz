import React, { useEffect, useState } from 'react';
import { useApolloQuery } from '../../apollo/utils';
import { connect } from 'react-redux';
import { GET_RUNS, GET_RUN_DATA } from '../../apollo/queries';
import { NEW_RUN_SUBSCRIPTION } from '../../apollo/subscriptions';
import Button from '../ui/button';
import Details from '../experiment-tracking/details';
import Sidebar from '../sidebar';

import './experiment-wrapper.css';

const MAX_NUMBER_COMPARISONS = 2; // 0-based, so three.

const ExperimentWrapper = ({ theme }) => {
  const [disableRunSelection, setDisableRunSelection] = useState(false);
  const [enableComparisonView, setEnableComparisonView] = useState(false);
  const [enableShowChanges, setEnableShowChanges] = useState(true);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [pinnedRun, setPinnedRun] = useState();
  const [selectedRunIds, setSelectedRunIds] = useState([]);
  const [selectedRunData, setSelectedRunData] = useState(null);
  const [showRunDetailsModal, setShowRunDetailsModal] = useState(false);
  const [showRunExportModal, setShowRunExportModal] = useState(false);
  const [showRunPlotsModal, setShowRunPlotsModal] = useState(false);

  // Fetch all runs.
  const { subscribeToMore, data, loading } = useApolloQuery(GET_RUNS);

  // Fetch all data for selected runs.
  const {
    data: { runMetadata = [], plots = [], metrics = [], JSONData = [] } = [],
    error: runDataError,
  } = useApolloQuery(GET_RUN_DATA, {
    skip: selectedRunIds.length === 0,
    variables: { runIds: selectedRunIds, showDiff: true },
  });

  let runTrackingData = {};

  if (plots.length > 0) {
    runTrackingData['Plots'] = plots;
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
        setSelectedRunIds(selectedRunIds.filter((run) => run !== id));
      } else {
        setSelectedRunIds([...selectedRunIds, id]);
      }
    } else {
      if (selectedRunIds.includes(id)) {
        return;
      } else {
        setSelectedRunIds([id]);
      }
    }
  };

  const onToggleComparisonView = () => {
    setEnableComparisonView(!enableComparisonView);

    if (enableComparisonView && selectedRunIds.length > 1) {
      setSelectedRunIds(selectedRunIds.slice(0, 1));
    }
  };

  useEffect(() => {
    if (selectedRunIds.length > MAX_NUMBER_COMPARISONS) {
      setDisableRunSelection(true);
    } else {
      setDisableRunSelection(false);
    }
  }, [selectedRunIds]);

  useEffect(() => {
    if (data?.runsList.length > 0 && selectedRunIds.length === 0) {
      /**
       * If we return runs and don't yet have a selected run, set the first one
       * as the default, with precedence given to runs that are bookmarked.
       */
      const bookmarkedRuns = data.runsList.filter((run) => {
        return run.bookmark === true;
      });

      if (bookmarkedRuns.length > 0) {
        setSelectedRunIds(bookmarkedRuns.map((run) => run.id).slice(0, 1));
      } else {
        setSelectedRunIds(data.runsList.map((run) => run.id).slice(0, 1));
      }
    }
  }, [data, selectedRunIds]);

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

  return (
    <>
      {data?.runsList.length > 0 ? (
        <>
          <Sidebar
            disableRunSelection={disableRunSelection}
            enableComparisonView={enableComparisonView}
            enableShowChanges={enableShowChanges}
            isExperimentView
            onRunSelection={onRunSelection}
            onToggleComparisonView={onToggleComparisonView}
            runsListData={data.runsList}
            selectedRunData={selectedRunData}
            selectedRunIds={selectedRunIds}
            setEnableShowChanges={setEnableShowChanges}
            setSidebarVisible={setIsSidebarVisible}
            showRunDetailsModal={setShowRunDetailsModal}
            sidebarVisible={isSidebarVisible}
            setShowRunExportModal={setShowRunExportModal}
          />
          {selectedRunIds.length > 0 ? (
            <Details
              enableComparisonView={enableComparisonView}
              enableShowChanges={enableShowChanges && selectedRunIds.length > 1}
              runDataError={runDataError}
              onRunSelection={onRunSelection}
              pinnedRun={pinnedRun}
              runMetadata={runMetadata}
              runTrackingData={runTrackingData}
              selectedRunIds={selectedRunIds}
              setPinnedRun={setPinnedRun}
              setShowRunDetailsModal={setShowRunDetailsModal}
              showRunDetailsModal={showRunDetailsModal}
              setShowRunPlotsModal={setShowRunPlotsModal}
              showRunPlotsModal={showRunPlotsModal}
              sidebarVisible={isSidebarVisible}
              theme={theme}
              showRunExportModal={showRunExportModal}
              setShowRunExportModal={setShowRunExportModal}
            />
          ) : null}
        </>
      ) : (
        <div className="experiment-wrapper">
          <h2 className="experiment-wrapper__header">
            You don't have any experiments
          </h2>
          <p className="experiment-wrapper__text">
            Kedro can help you manage your experiments. Learn more how you can
            enable experiment tracking in your projects from our docs.{' '}
          </p>
          <a
            href="https://kedro.readthedocs.io/en/stable/logging/experiment_tracking.html"
            rel="noreferrer"
            target="_blank"
          >
            <Button>View docs</Button>
          </a>
        </div>
      )}
    </>
  );
};

export const mapStateToProps = (state) => ({
  theme: state.theme,
});

export default connect(mapStateToProps)(ExperimentWrapper);
