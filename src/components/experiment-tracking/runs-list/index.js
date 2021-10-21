import React from 'react';
import Accordion from '../accordion';
import RunsListCard from '../runs-list-card';
import { useRunIdsFromUrl } from '../../../utils';

import './runs-list.css';

/**
 * Main runs-list container.
 */
const RunsList = ({ runData }) => {
  const { run, compare } = useRunIdsFromUrl();

  const { runsList } = runData;

  return (
    <>
      <Accordion heading="All" headingDetail={runsList.length}>
        <div className="runs-list__wrapper">
          {runsList.map((data, i) => (
            <RunsListCard data={data} key={i} />
          ))}
        </div>
      </Accordion>
    </>
  );
};

export default RunsList;
