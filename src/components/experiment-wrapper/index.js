import React, { useEffect, useState } from 'react';
import { useApolloQuery } from '../../apollo/utils';
import { connect } from 'react-redux';
import { GET_RUNS } from '../../apollo/queries';
import Button from '@quantumblack/kedro-ui/lib/components/button';
import Details from '../experiment-tracking/details';
import Sidebar from '../sidebar';

import './experiment-wrapper.css';

const MAX_NUMBER_COMPARISONS = 2; // 0-based, so three

const ExperimentWrapper = ({ theme }) => {
  const [disableRunSelection, setDisableRunSelection] = useState(false);
  const [enableComparisonView, setEnableComparisonView] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [selectedRuns, setSelectedRuns] = useState([]);
  const [showRunDetailsModal, setShowRunDetailsModal] = useState(false);

  const { data, loading } = useApolloQuery(GET_RUNS);

  const onRunSelection = (id) => {
    if (enableComparisonView) {
      if (selectedRuns.includes(id)) {
        if (selectedRuns.length === 1) {
          return;
        }

        setSelectedRuns(selectedRuns.filter((run) => run !== id));
      } else {
        setSelectedRuns([...selectedRuns, id]);
      }
    } else {
      if (selectedRuns.includes(id)) {
        return;
      } else {
        setSelectedRuns([id]);
      }
    }
  };

  const onToggleComparisonView = () => {
    setEnableComparisonView(!enableComparisonView);

    if (enableComparisonView && selectedRuns.length > 1) {
      setSelectedRuns(selectedRuns.slice(0, 1));
    }
  };

  useEffect(() => {
    if (selectedRuns.length > MAX_NUMBER_COMPARISONS) {
      setDisableRunSelection(true);
    } else {
      setDisableRunSelection(false);
    }
  }, [selectedRuns]);

  useEffect(() => {
    if (data?.runsList.length > 0) {
      // If we return runs, set the first one as the default.
      setSelectedRuns(data.runsList.map((run) => run.id).slice(0, 1));
    }
  }, [data]);

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
            isExperimentView
            onRunSelection={onRunSelection}
            onToggleComparisonView={onToggleComparisonView}
            runsListData={data.runsList}
            selectedRuns={selectedRuns}
            sidebarVisible={isSidebarVisible}
            setSidebarVisible={setIsSidebarVisible}
            showRunDetailsModal={setShowRunDetailsModal}
          />
          {selectedRuns.length > 0 ? (
            <Details
              enableComparisonView={enableComparisonView}
              selectedRuns={selectedRuns}
              setShowRunDetailsModal={setShowRunDetailsModal}
              showRunDetailsModal={showRunDetailsModal}
              sidebarVisible={isSidebarVisible}
              theme={theme}
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
            href="https://github.com/quantumblacklabs/kedro-viz"
            rel="noreferrer"
            target="_blank"
          >
            <Button onClick={() => {}} theme={theme}>
              View docs
            </Button>
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
