import React, { useState } from 'react';
// import { runs, trackingData } from './mock-data';
import Sidebar from '../experiment-tracking/sidebar';
import Details from '../experiment-tracking/details';
import { Provider } from '../provider/provider';

/**
 * Main experiment tracking page container. Handles showing/hiding the sidebar
 * nav for experiment tracking and the display of the experiment details
 * single / comparison view.
 */
const ExperimentWrapper = () => {
  const [selectedRun, setSelectedRun] = useState(null);

  const onRunSelection = (id) => {
    setSelectedRun(id);
  };

  return (
    <>
      <Provider useMocks={true}>
        <Sidebar onRunSelection={onRunSelection} />
        <Details selectedRun={selectedRun} />
      </Provider>
    </>
  );
};

export default ExperimentWrapper;
