import React from 'react';
import { useApolloQuery } from '../../../apollo/utils';
import classnames from 'classnames';
import RunMetadata from '../run-metadata';
import RunDataset from '../run-dataset';
import {
  GET_RUN_METADATA,
  GET_RUN_TRACKING_DATA,
} from '../../../apollo/queries';

import './details.css';

const Details = ({
  selectedRuns,
  sidebarVisible,
  enableShowChanges,
  pinnedRun,
  setPinnedRun,
}) => {
  const { data: { runMetadata } = [], error } = useApolloQuery(
    GET_RUN_METADATA,
    {
      skip: selectedRuns.length === 0,
      variables: { runIds: selectedRuns },
    }
  );

  const { data: { runTrackingData } = [], error: trackingError } =
    useApolloQuery(GET_RUN_TRACKING_DATA, {
      skip: selectedRuns.length === 0,
      variables: { runIds: selectedRuns, showDiff: false },
    });

  if (error || trackingError) {
    return null;
  }

  const isSingleRun = runMetadata && runMetadata.length === 1 ? true : false;

  return (
    <>
      <div
        className={classnames('kedro', 'details-mainframe', {
          'details-mainframe--sidebar-visible': sidebarVisible,
        })}
      >
        <RunMetadata
          isSingleRun={isSingleRun}
          runs={runMetadata}
          enableShowChanges={enableShowChanges}
          pinnedRun={pinnedRun}
          setPinnedRun={setPinnedRun}
        />
        <RunDataset
          isSingleRun={isSingleRun}
          trackingData={runTrackingData}
          pinnedRun={pinnedRun}
          enableShowChanges={enableShowChanges}
        />
      </div>
    </>
  );
};

export default Details;
