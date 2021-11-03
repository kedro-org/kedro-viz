import React, { useCallback, useState } from 'react';
import Sidebar from '../sidebar';
import Details from '../experiment-tracking/details';
// import { Provider } from '../provider/provider';

/**
 * Main experiment tracking page container. Handles showing/hiding the sidebar
 * nav for experiment tracking and the display of the experiment details
 * single / comparison view.
 */
const ExperimentWrapper = () => {
  const [selectedRun, setSelectedRun] = useState(null);
  const [enableComparisonView, setEnableComparisonView] = useState(false);

  const onRunSelection = useCallback((id) => setSelectedRun(id), []);

  const onToggleComparison = useCallback(
    () => setEnableComparisonView(!enableComparisonView),
    [enableComparisonView]
  );

  return (
    <>
      <Sidebar
        enableComparisonView={enableComparisonView}
        isExperimentView
        onRunSelection={onRunSelection}
        onToggleComparison={onToggleComparison}
      />
      <Details selectedRun={selectedRun} />
    </>
  );
};

export default ExperimentWrapper;
