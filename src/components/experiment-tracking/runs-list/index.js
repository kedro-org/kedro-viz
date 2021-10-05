import React from 'react';
import { useParams } from 'react-router-dom';

/**
 * Main runslist container.
 */
export const RunsList = () => {
  let { id } = useParams();

  return (
    <div>
      <h1>
        {typeof id !== 'undefined' ? `Run ${id} selected` : 'No selected run'}
      </h1>
    </div>
  );
};

export default RunsList;
