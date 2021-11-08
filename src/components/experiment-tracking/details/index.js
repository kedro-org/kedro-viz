import React from 'react';
import { useQuery } from '@apollo/client';
import classnames from 'classnames';
import { connect } from 'react-redux';
import RunMetadata from '../run-metadata';
import RunDataset from '../run-dataset';
import {
  GET_RUN_METADATA,
  GET_RUN_TRACKING_DATA,
} from '../../../apollo/queries';

import './details.css';

/**
 * Main experiment tracking page container. Handles showing/hiding the sidebar
 * nav for experiment tracking, the display of experiment details,
 * as well as the comparison view.
 */
const Details = ({ selectedRuns, sidebarVisible }) => {
  const { loading, error, data } = useQuery(GET_RUN_METADATA, {
    variables: { runs: selectedRuns },
  });

  const {
    loading: trackingLoading,
    error: trackingError,
    data: trackingData,
  } = useQuery(GET_RUN_TRACKING_DATA, {
    variables: { runs: selectedRuns },
  });

  if (loading || trackingLoading) {
    return 'Loading...';
  }

  if (error || trackingError) {
    return null;
  }

  const isSingleRun = data.runMetadata.length === 1 ? true : false;

  return (
    <>
      <div
        className={classnames('kedro', 'details-mainframe', {
          'details-mainframe--sidebar-visible': sidebarVisible,
        })}
      >
        <RunMetadata isSingleRun={isSingleRun} runs={data.runMetadata} />
        <RunDataset
          isSingleRun={isSingleRun}
          trackingData={trackingData.runTrackingData}
        />
      </div>
    </>
  );
};

export const mapStateToProps = (state) => ({
  sidebarVisible: state.visible.sidebar,
});

export default connect(mapStateToProps)(Details);
