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
  enableShowChanges,
  onRunSelection,
  pinnedRun,
  selectedRunIds,
  setPinnedRun,
  setShowRunDetailsModal,
  showRunDetailsModal,
  sidebarVisible,
  theme,
}) => {
  const [runMetadataToEdit, setRunMetadataToEdit] = useState(null);
  const { data: { runMetadata } = [], error } = useApolloQuery(
    GET_RUN_METADATA,
    {
      skip: selectedRunIds.length === 0,
      variables: { runIds: selectedRunIds },
    }
  );

  const { data: { runTrackingData } = [], error: trackingError } =
    useApolloQuery(GET_RUN_TRACKING_DATA, {
      skip: selectedRunIds.length === 0,
      variables: { runIds: selectedRunIds, showDiff: false },
    });

  useEffect(() => {
    if (runMetadata && !enableComparisonView) {
      const metadata = runMetadata.find((run) => run.id === selectedRunIds[0]);

      setRunMetadataToEdit(metadata);
    }
  }, [enableComparisonView, runMetadata, selectedRunIds]);

  const isSingleRun = runMetadata?.length === 1 ? true : false;

  if (error || trackingError) {
    return null;
  }

  return (
    <>
      <RunDetailsModal
        onClose={setShowRunDetailsModal}
        runs={runMetadata}
        runMetadataToEdit={runMetadataToEdit}
        theme={theme}
        visible={showRunDetailsModal}
      />
      <div
        className={classnames('kedro', 'details-mainframe', {
          'details-mainframe--sidebar-visible': sidebarVisible,
        })}
      >
        <RunMetadata
          enableShowChanges={enableShowChanges}
          isSingleRun={isSingleRun}
          onRunSelection={onRunSelection}
          pinnedRun={pinnedRun}
          runs={runMetadata}
          setPinnedRun={setPinnedRun}
          setRunMetadataToEdit={setRunMetadataToEdit}
          setShowRunDetailsModal={setShowRunDetailsModal}
        />
        <RunDataset
          enableShowChanges={enableShowChanges}
          isSingleRun={isSingleRun}
          pinnedRun={pinnedRun}
          trackingData={runTrackingData}
        />
      </div>
    </>
  );
};

export default Details;
