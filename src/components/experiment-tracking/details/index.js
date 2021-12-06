import React, { useEffect, useState } from 'react';
import { useApolloQuery } from '../../../apollo/utils';
import classnames from 'classnames';
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
  const [selectedMetadataRunId, setSelectedMetadataRunId] = useState(null);
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
    if (!runMetadata) {
      return;
    }

    if (!enableComparisonView) {
      const metadata = runMetadata.find((run) => run.id === selectedRuns[0]);

      setSelectedRunMetadata(metadata);
    } else {
      const metadata = runMetadata.find(
        (run) => run.id === selectedMetadataRunId
      );

      setSelectedRunMetadata(metadata);
    }
  }, [enableComparisonView, runMetadata, selectedMetadataRunId, selectedRuns]);

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
        <RunMetadata
          isSingleRun={isSingleRun}
          runs={runMetadata}
          setSelectedMetadataRunId={setSelectedMetadataRunId}
          setShowRunDetailsModal={setShowRunDetailsModal}
        />
        <RunDataset isSingleRun={isSingleRun} trackingData={runTrackingData} />
      </div>
    </>
  );
};

export default Details;
