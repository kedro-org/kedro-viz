import React, { useState } from 'react';
import Sidebar from '../sidebar';
import Details from '../experiment-tracking/details';

/**
 * Main experiment tracking page container. Handles showing/hiding the sidebar
 * nav for experiment tracking and the display of the experiment details
 * single / comparison view.
 */
const ExperimentWrapper = () => {
  const [selectedRuns, setSelectedRuns] = useState([]);
  const [enableComparisonView, setEnableComparisonView] = useState(false);

  const onRunSelection = (id) => {
    if (enableComparisonView) {
      return;
    } else {
      if (selectedRuns.includes(id)) {
        setSelectedRuns([]);
      } else {
        setSelectedRuns([id]);
      }
    }
  };

  const onToggleComparison = () => {
    setEnableComparisonView(!enableComparisonView);
  };

  return (
    <>
      <Sidebar
        enableComparisonView={enableComparisonView}
        isExperimentView
        onRunSelection={onRunSelection}
        onToggleComparison={onToggleComparison}
        selectedRuns={selectedRuns}
      />
      <Details selectedRuns={selectedRuns} />
    </>
  );
};

export default ExperimentWrapper;
