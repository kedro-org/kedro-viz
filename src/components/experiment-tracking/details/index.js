import React, { useEffect, useState } from 'react';
import { useApolloQuery } from '../../../apollo/utils';
import classnames from 'classnames';
import { connect } from 'react-redux';
import RunMetadata from '../run-metadata';
import RunDataset from '../run-dataset';
import RunDetailsModal from '../run-details-modal';
import {
  GET_RUN_METADATA,
  GET_RUN_TRACKING_DATA,
} from '../../../apollo/queries';

import './details.css';

const Details = ({
  enableComparisonView,
  selectedRuns,
  setShowRunDetailsModal,
  showRunDetailsModal,
  sidebarVisible,
  theme,
}) => {
  const [selectedRunMetadata, setSelectedRunMetadata] = useState(null);
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

  useEffect(() => {
    if (!enableComparisonView && runMetadata) {
      const metadata = runMetadata.find((run) => run.id === selectedRuns[0]);

      setSelectedRunMetadata(metadata);
    }
  }, [enableComparisonView, runMetadata, selectedRuns]);

  const isSingleRun = runMetadata?.length === 1 ? true : false;

  if (error || trackingError) {
    return null;
  }

  return (
    <>
      <RunDetailsModal
        onClose={setShowRunDetailsModal}
        runs={runMetadata}
        selectedRunMetadata={selectedRunMetadata}
        theme={theme}
        visible={showRunDetailsModal}
      />
      <div
        className={classnames('kedro', 'details-mainframe', {
          'details-mainframe--sidebar-visible': sidebarVisible,
        })}
      >
        <RunMetadata isSingleRun={isSingleRun} runs={runMetadata} />
        <RunDataset isSingleRun={isSingleRun} trackingData={runTrackingData} />
      </div>
    </>
  );
};

export const mapStateToProps = (state) => ({
  sidebarVisible: state.visible.sidebar,
  theme: state.theme,
});

export default connect(mapStateToProps)(Details);
