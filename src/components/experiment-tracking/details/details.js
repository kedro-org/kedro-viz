import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import RunMetadata from '../run-metadata';
import { RunMetadataLoader } from '../run-metadata/run-metadata-loader';
import RunDataset from '../run-dataset';
import { RunDatasetLoader } from '../run-dataset/run-dataset-loader';
import RunDetailsModal from '../run-details-modal';
import RunPlotsModal from '../run-plots-modal';
import RunExportModal from '../run-export-modal';
import { ButtonTimeoutContextProvider } from '../../../utils/button-timeout-context';

import './details.css';

const Details = ({
  enableComparisonView,
  enableShowChanges,
  runDataError,
  onRunSelection,
  pinnedRun,
  runMetadata,
  runTrackingData,
  selectedRunIds,
  setPinnedRun,
  setShowRunDetailsModal,
  setShowRunExportModal,
  setShowRunPlotsModal,
  showRunDetailsModal,
  showRunExportModal,
  showRunPlotsModal,
  sidebarVisible,
  isRunDataLoading,
  newRunAdded,
  theme,
}) => {
  const [runMetadataToEdit, setRunMetadataToEdit] = useState(null);
  const [runDatasetToShow, setRunDatasetToShow] = useState({});
  const [showSingleRunLoader, setShowSingleRunLoader] = useState(false);
  const [showRunLoader, setRunLoader] = useState(false);

  useEffect(() => {
    // delay showing loader for 0.1s so it has enough time to load the data first
    const setShowLoaderTimer = setTimeout(() => {
      if (isRunDataLoading && newRunAdded) {
        setRunLoader(true);
      } else {
        setRunLoader(false);
      }

      if (isRunDataLoading && !enableComparisonView) {
        setShowSingleRunLoader(true);
      } else {
        setShowSingleRunLoader(false);
      }
    }, 100);

    return () => clearTimeout(setShowLoaderTimer);
  }, [isRunDataLoading, newRunAdded, enableComparisonView]);

  useEffect(() => {
    if (runMetadata && !enableComparisonView) {
      const metadata = runMetadata.find((run) => run.id === selectedRunIds[0]);

      setRunMetadataToEdit(metadata);
    }
  }, [enableComparisonView, runMetadata, selectedRunIds]);

  const isSingleRun = runMetadata?.length === 1 ? true : false;

  if (runDataError) {
    return null;
  }

  if (showSingleRunLoader) {
    return (
      <div
        className={classnames('kedro', 'details-mainframe', {
          'details-mainframe--sidebar-visible': sidebarVisible,
        })}
      >
        <RunMetadataLoader theme={theme} />
        <RunDatasetLoader theme={theme} />
      </div>
    );
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
          showLoader={showRunLoader}
          theme={theme}
        />
        <RunDataset
          enableComparisonView={enableComparisonView}
          enableShowChanges={enableShowChanges}
          isSingleRun={isSingleRun}
          pinnedRun={pinnedRun}
          setRunDatasetToShow={setRunDatasetToShow}
          setShowRunPlotsModal={setShowRunPlotsModal}
          showLoader={showRunLoader}
          trackingData={runTrackingData}
          theme={theme}
        />
      </div>
    </>
  );
};

export default Details;
