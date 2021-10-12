import React from 'react';
import Accordion from '../accordion';
import RunsListCard from '../runs-list-card';
import { useRunIdsFromUrl } from '../../../utils';

import './runs-list.css';

const runData = [
  {
    bookmark: true,
    id: 'd36fce9',
    timestamp: '2021-09-08T10:55:36.810Z',
    title: 'Sprint 5',
  },
  {
    bookmark: false,
    id: '05542fb',
    timestamp: '2021-09-07T11:36:24.560Z',
    title: 'Sprint 6',
  },
  {
    bookmark: false,
    id: '80c0d3a',
    timestamp: '2021-09-04T04:36:24.560Z',
  },
  {
    bookmark: false,
    id: 'ef32bfd',
    timestamp: '2021-08-31T01:36:24.560Z',
    title: 'Sprint 4 EOW',
  },
  {
    bookmark: false,
    id: '12039a1',
    timestamp: '2021-08-08T07:28:12.336Z',
    title: 'Sprint 5 BOW',
  },
];

/**
 * Main runs-list container.
 */
const RunsList = () => {
  const { run, compare, compareList } = useRunIdsFromUrl();

  // the following are only placeholders to indicate routing intent and should
  // be deleted on building the actual implementation of the runsList
  return (
    <>
      <h1>
        {run !== null
          ? 'Single view'
          : compare !== null
          ? 'Compare view'
          : 'No runs'}
      </h1>
      {run !== null && <h2>Run {run} selected</h2>}
      {compareList !== null &&
        compareList.map((run, i) => <h2 key={i}>Run {run} selected</h2>)}
      <Accordion heading="All" headingDetail={runData.length}>
        <div className="runs-list__wrapper">
          {runData.map((data, i) => (
            <RunsListCard data={data} key={i} />
          ))}
        </div>
      </Accordion>
    </>
  );
};

export default RunsList;
