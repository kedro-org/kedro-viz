import React from 'react';
import Accordion from '../accordion';
import RunsListCard from '../runs-list-card';

import './runs-list.css';

const RunsList = ({
  disableRunSelection,
  enableComparisonView,
  onRunSelection,
  runData,
  selectedRunIds,
}) => {
  const bookmarkedRuns = runData.filter((run) => run.bookmark === true);
  const unbookmarkedRuns = runData.filter((run) => run.bookmark === false);

  return (
    <>
      {bookmarkedRuns.length > 0 ? (
        <Accordion
          heading="Bookmarked"
          headingClassName="runs-list__accordion-header"
          headingDetail={runData.filter((run) => run.bookmark === true).length}
        >
          <div className="runs-list__wrapper">
            {bookmarkedRuns.map((data, i) => (
              <RunsListCard
                data={data}
                disableRunSelection={disableRunSelection}
                enableComparisonView={enableComparisonView}
                key={i}
                onRunSelection={onRunSelection}
                selectedRunIds={selectedRunIds}
              />
            ))}
          </div>
        </Accordion>
      ) : null}
      {unbookmarkedRuns.length > 0 ? (
        <Accordion
          heading={`${bookmarkedRuns.length === 0 ? 'All' : 'Unbookmarked'}`}
          headingClassName="runs-list__accordion-header"
          headingDetail={runData.filter((run) => run.bookmark === false).length}
        >
          <div className="runs-list__wrapper">
            {unbookmarkedRuns.map((data, i) => (
              <RunsListCard
                data={data}
                disableRunSelection={disableRunSelection}
                enableComparisonView={enableComparisonView}
                key={i}
                onRunSelection={onRunSelection}
                selectedRunIds={selectedRunIds}
              />
            ))}
          </div>
        </Accordion>
      ) : null}
    </>
  );
};

export default RunsList;
