import React, { useState } from 'react';
import debounce from 'lodash/debounce';
import SearchList from '../../search-list';
import Switch from '../../switch';
import Accordion from '../accordion';
import RunsListCard from '../runs-list-card';

import './runs-list.css';

const RunsList = ({
  disableRunSelection,
  enableComparisonView,
  onRunSelection,
  onToggleComparisonView,
  runData,
  selectedRunIds,
}) => {
  const bookmarkedRuns = runData.filter((run) => run.bookmark === true);
  const unbookmarkedRuns = runData.filter((run) => run.bookmark === false);
  const [searchValue, updateSearchValue] = useState('');

  return (
    <>
      <div className="search-bar-wrapper">
        <SearchList
          onUpdateSearchValue={debounce(updateSearchValue, 250)}
          searchValue={searchValue}
        />
      </div>
      <div className="compare-switch-wrapper">
        <span className="compare-switch-wrapper__text">
          Compare runs (max. 3)
        </span>
        <Switch onChange={onToggleComparisonView} />
      </div>
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
