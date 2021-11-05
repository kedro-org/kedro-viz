import React from 'react';
import { useQuery } from '@apollo/client';
import classnames from 'classnames';
import { connect } from 'react-redux';
import RunMetadata from '../run-metadata';
import RunDataset from '../run-dataset';
import { GET_RUN_METADATA } from '../../../apollo/queries';

import './details.css';

/**
 * Main experiment tracking page container. Handles showing/hiding the sidebar
 * nav for experiment tracking, the display of experiment details,
 * as well as the comparison view.
 */
const Details = ({ selectedRuns, sidebarVisible }) => {
  const { loading, error, data } = useQuery(GET_RUN_METADATA, {
    variables: { runs: 'test' },
    skip: selectedRuns.length === 0,
  });

  const isSingleRun = data && data.runMetadata.length === 1 ? true : false;
  const trackingData = [];

  if (loading) {
    return 'Loading...';
  }

  if (error) {
    return null;
  }

  return (
    <>
      <div
        className={classnames('kedro', 'details-mainframe', {
          'details-mainframe--sidebar-visible': sidebarVisible,
        })}
      >
        {data ? (
          <RunMetadata isSingleRun={isSingleRun} runs={data.runMetadata} />
        ) : (
          <div className="details-metadata"></div>
        )}
        <RunDataset isSingleRun={isSingleRun} trackingData={trackingData} />
      </div>
    </>
  );
};

export const mapStateToProps = (state) => ({
  sidebarVisible: state.visible.sidebar,
});

export default connect(mapStateToProps)(Details);
