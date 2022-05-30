import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import RunMetadata from '../run-metadata';
import RunDataset from '../run-dataset';
import RunDetailsModal from '../run-details-modal';

import './details.css';

const Details = ({
  enableComparisonView,
  enableShowChanges,
  metadataError,
  onRunSelection,
  pinnedRun,
  runMetadata,
  runTrackingData,
  selectedRunIds,
  setPinnedRun,
  setShowRunDetailsModal,
  showRunDetailsModal,
  sidebarVisible,
  theme,
  trackingDataError,
}) => {
  const [runMetadataToEdit, setRunMetadataToEdit] = useState(null);

  useEffect(() => {
    if (runMetadata && !enableComparisonView) {
      const metadata = runMetadata.find((run) => run.id === selectedRunIds[0]);

      setRunMetadataToEdit(metadata);
    }
  }, [enableComparisonView, runMetadata, selectedRunIds]);

  const isSingleRun = runMetadata?.length === 1 ? true : false;

  if (metadataError || trackingDataError) {
    return null;
  }

  return (
    <>
      <RunDetailsModal
        runMetadataToEdit={runMetadataToEdit}
        runs={runMetadata}
        setShowRunDetailsModal={setShowRunDetailsModal}
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
          selectedRunIds={selectedRunIds}
          trackingData={runTrackingData}
        />
      </div>
    </>
  );
};

export default Details;
