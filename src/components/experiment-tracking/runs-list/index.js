import React from 'react';
import Accordion from '../accordion';
import RunsListCard from '../runs-list-card';

import './runs-list.css';

const RunsList = ({
  disableRunSelection,
  enableComparisonView,
  onRunSelection,
  runData,
  selectedRuns,
}) => {
  return (
    <>
      <Accordion
        heading="All"
        headingClassName="runs-list__accordion-header"
        headingDetail={runData.length}
      >
        <div className="runs-list__wrapper">
          {runData.map((data, i) => (
            <RunsListCard
              data={data}
              disableRunSelection={disableRunSelection}
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
