import React from 'react';
import Accordion from '../accordion';
import RunsListCard from '../runs-list-card';

import './runs-list.css';

/**
 * Main runs-list container.
 */
const RunsList = ({
  enableComparisonView,
  onRunSelection,
  runData,
  selectedRuns,
}) => {
  const { runsList } = runData;

  return (
    <>
      <Accordion
        heading="All"
        headingClassName="runs-list__accordion-header"
        headingDetail={runsList.length}
      >
        <div className="runs-list__wrapper">
          {runsList.map((data, i) => (
            <RunsListCard
              data={data}
              enableComparisonView={enableComparisonView}
              key={i}
              onRunSelection={onRunSelection}
              selectedRuns={selectedRuns}
            />
          ))}
        </div>
      </Accordion>
    </>
  );
};

export default RunsList;
