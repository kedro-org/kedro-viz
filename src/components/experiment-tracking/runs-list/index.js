import React from 'react';
import { useRunIdsFromUrl } from '../../../utils';

/**
 * Main runslist container.
 */
export const RunsList = () => {
  const { run, compare, compareList } = useRunIdsFromUrl();

  // the following are only placeholders to indicate routing intent and should be
  // deleted on building the actual implementation of the runsList
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
    </>
  );
};

export default RunsList;
