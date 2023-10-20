import React, { useState } from 'react';
import { connect } from 'react-redux';
import debounce from 'lodash/debounce';
import { textMatchesSearch } from '../../../utils/search-utils';
import SearchList from '../../search-list';
import Switch from '../../ui/switch';
import Accordion from '../accordion';
import RunsListCard from '../runs-list-card';
import { metricLimit } from '../../../config';

import './runs-list.scss';

/**
 * Return only the runs that match the search text
 * @param {Object} runData original set of runs
 * @param {String} searchValue Search term
 * @return {Object} Grouped nodes
 */
const getFilteredRunList = (runData, searchValue, runsMetadata) => {
  // filter the runs that matches the runId
  const filteredRuns = runData?.filter(
    (run) =>
      textMatchesSearch(runsMetadata[run.id]?.title || run.id, searchValue) ||
      textMatchesSearch(runsMetadata[run.id]?.notes || '', searchValue) ||
      textMatchesSearch(run.gitSha, searchValue)
  );

  return filteredRuns;
};

const RunsList = ({
  disableRunSelection,
  enableComparisonView,
  isDisplayingMetrics,
  onRunSelection,
  onToggleComparisonView,
  runData,
  selectedRunIds,
  runsMetadata,
}) => {
  const [searchValue, updateSearchValue] = useState('');

  const condensedRunsList = isDisplayingMetrics
    ? runData.slice(0, metricLimit)
    : runData;
  const filteredRunList = getFilteredRunList(
    condensedRunsList,
    searchValue,
    runsMetadata
  );

  const bookmarkedRuns = filteredRunList.filter(
    (run) => runsMetadata[run.id] && runsMetadata[run.id].bookmark === true
  );
  const unbookmarkedRuns = filteredRunList.filter(
    (run) => !runsMetadata[run.id] || !runsMetadata[run.id].bookmark
  );

  return (
    <>
      <div className="runs-list-top-wrapper">
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
          <Switch
            defaultChecked={enableComparisonView}
            onChange={onToggleComparisonView}
          />
        </div>
      </div>
      {bookmarkedRuns.length > 0 ? (
        <Accordion
          heading="Bookmarked"
          headingClassName="runs-list__accordion-header"
          headingDetail={bookmarkedRuns.length}
        >
          <div className="runs-list__wrapper">
            {bookmarkedRuns.map((data) => (
              <RunsListCard
                data={data}
                disableRunSelection={disableRunSelection}
                enableComparisonView={enableComparisonView}
                key={data.id}
                onRunSelection={onRunSelection}
                selectedRunIds={selectedRunIds}
                searchValue={searchValue}
                selectedIndex={selectedRunIds.indexOf(data.id)}
              />
            ))}
          </div>
        </Accordion>
      ) : null}
      {unbookmarkedRuns.length > 0 ? (
        <Accordion
          heading={`${bookmarkedRuns.length === 0 ? 'All' : 'Unbookmarked'}`}
          headingClassName="runs-list__accordion-header"
          headingDetail={unbookmarkedRuns.length}
        >
          <div className="runs-list__wrapper">
            {unbookmarkedRuns.map((data) => (
              <RunsListCard
                data={data}
                disableRunSelection={disableRunSelection}
                enableComparisonView={enableComparisonView}
                key={data.id}
                onRunSelection={onRunSelection}
                selectedRunIds={selectedRunIds}
                searchValue={searchValue}
                selectedIndex={selectedRunIds.indexOf(data.id)}
              />
            ))}
          </div>
        </Accordion>
      ) : null}
    </>
  );
};

export const mapStateToProps = (state) => ({
  runsMetadata: state.runsMetadata,
});

export default connect(mapStateToProps)(RunsList);
