import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import RunMetadata from '../run-metadata';
import RunDataset from '../run-dataset';
import RunDetailsModal from '../run-details-modal';
import RunExportModal from '../run-export-modal.js';
import { ButtonTimeoutContextProvider } from '../../../utils/button-timeout-context';

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
  setShowRunExportModal,
  showRunDetailsModal,
  showRunExportModal,
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
      <ButtonTimeoutContextProvider>
        <RunDetailsModal
          runMetadataToEdit={runMetadataToEdit}
          runs={runMetadata}
          setShowRunDetailsModal={setShowRunDetailsModal}
          theme={theme}
          visible={showRunDetailsModal}
        />
        <RunExportModal
          runMetadata={runMetadata}
          runTrackingData={runTrackingData}
          setShowRunExportModal={setShowRunExportModal}
          theme={theme}
          visible={showRunExportModal}
        />
      </ButtonTimeoutContextProvider>
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
