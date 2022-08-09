import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import RunMetadata from '../run-metadata';
import RunDataset from '../run-dataset';
import RunDetailsModal from '../run-details-modal';
import RunPlotsModal from '../run-plots-modal';
import RunExportModal from '../run-export-modal';
import { ButtonTimeoutContextProvider } from '../../../utils/button-timeout-context';

import './details.css';

const Details = ({
  enableComparisonView,
  enableShowChanges,
  dataError,
  onRunSelection,
  pinnedRun,
  masterData,
  selectedRunIds,
  setPinnedRun,
  setShowRunDetailsModal,
  setShowRunExportModal,
  setShowRunPlotsModal,
  showRunDetailsModal,
  showRunExportModal,
  showRunPlotsModal,
  sidebarVisible,
  theme,
}) => {
  const [runMetadataToEdit, setRunMetadataToEdit] = useState(null);
  const [runDatasetToShow, setRunDatasetToShow] = useState({});

  const runMetadata = masterData ? masterData['MetaData'] : [];
  const runTrackingData = masterData ? masterData['TrackingData'] : {};

  useEffect(() => {
    if (runMetadata && !enableComparisonView) {
      const metadata = runMetadata.find((run) => run.id === selectedRunIds[0]);

      setRunMetadataToEdit(metadata);
    }
  }, [enableComparisonView, runMetadata, selectedRunIds]);

  const isSingleRun = runMetadata?.length === 1 ? true : false;

  if (dataError) {
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
        <RunPlotsModal
          runDatasetToShow={runDatasetToShow}
          setShowRunPlotsModal={setShowRunPlotsModal}
          theme={theme}
          visible={showRunPlotsModal}
        />
      </ButtonTimeoutContextProvider>
      <div
        className={classnames('kedro', 'details-mainframe', {
          'details-mainframe--sidebar-visible': sidebarVisible,
        })}
      >
        <RunMetadata
          enableComparisonView={enableComparisonView}
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
          enableComparisonView={enableComparisonView}
          enableShowChanges={enableShowChanges}
          isSingleRun={isSingleRun}
          pinnedRun={pinnedRun}
          setRunDatasetToShow={setRunDatasetToShow}
          setShowRunPlotsModal={setShowRunPlotsModal}
          trackingData={runTrackingData}
        />
      </div>
    </>
  );
};

export default Details;
