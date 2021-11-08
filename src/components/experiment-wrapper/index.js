import React, { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import Sidebar from '../sidebar';
import Details from '../experiment-tracking/details';
import { GET_RUNS } from '../../apollo/queries';

/**
 * Main experiment tracking page container. Handles showing/hiding the sidebar
 * nav for experiment tracking and the display of the experiment details
 * single / comparison view.
 */

const MAX_NUMBER_COMPARISONS = 2; // 0-based, so three

const ExperimentWrapper = () => {
  const [disableRunSelection, setDisableRunSelection] = useState(false);
  const [enableComparisonView, setEnableComparisonView] = useState(false);
  const [selectedRuns, setSelectedRuns] = useState([]);

  const { data } = useQuery(GET_RUNS);

  const onRunSelection = (id) => {
    if (enableComparisonView) {
      if (selectedRuns.includes(id)) {
        setSelectedRuns(selectedRuns.filter((run) => run !== id));
      } else {
        setSelectedRuns([...selectedRuns, id]);
      }
    } else {
      if (selectedRuns.includes(id)) {
        setSelectedRuns([]);
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

  return (
    <>
      {data ? (
        <>
          <Sidebar
            disableRunSelection={disableRunSelection}
            enableComparisonView={enableComparisonView}
            isExperimentView
            onRunSelection={onRunSelection}
            onToggleComparisonView={onToggleComparisonView}
            runsListData={data.runsList}
            selectedRuns={selectedRuns}
          />
          {selectedRuns.length > 0 ? (
            <Details selectedRuns={selectedRuns} />
          ) : null}
        </>
      ) : (
        <p>Nothing here yet.</p>
      )}
    </>
  );
};

export default ExperimentWrapper;
