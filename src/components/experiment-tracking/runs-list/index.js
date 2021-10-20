import React from 'react';
import Accordion from '../accordion';
import RunsListCard from '../runs-list-card';
import { useRunIdsFromUrl } from '../../../utils';

import './runs-list.css';

/**
 * Main runs-list container.
 */
const RunsList = ({ runs }) => {
  const { run, compare } = useRunIdsFromUrl();

  return (
    <>
      <h1>
        {run !== null
          ? 'Single view'
          : compare !== null
          ? 'Compare view'
          : 'No runs'}
      </h1>
      <Accordion
        heading="All"
        headingClassName="runs-list__accordion-header"
        headingDetail={runs.length}
      >
        <div className="runs-list__wrapper">
          {runs.map((data, i) => (
            <RunsListCard data={data} key={i} />
          ))}
        </div>
      </Accordion>
    </>
  );
};

export default RunsList;
