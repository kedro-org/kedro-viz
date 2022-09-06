import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import RunMetadata from '../run-metadata';
import { SingleRunMetadataLoader } from '../run-metadata/run-metadata-loader';
import RunDataset from '../run-dataset';
import { SingleRunDatasetLoader } from '../run-dataset/run-dataset-loader';
import RunDetailsModal from '../run-details-modal';
import RunPlotsModal from '../run-plots-modal';
import RunExportModal from '../run-export-modal';
import { ButtonTimeoutContextProvider } from '../../../utils/button-timeout-context';

import './details.css';

const Details = ({
  enableComparisonView,
  enableShowChanges,
  isRunDataLoading,
  newRunAdded,
  onRunSelection,
  pinnedRun,
  runDataError,
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
  theme,
}) => {
  const [runMetadataToEdit, setRunMetadataToEdit] = useState(null);
  const [runDatasetToShow, setRunDatasetToShow] = useState({});
  const [showSingleRunLoader, setShowSingleRunLoader] = useState(false);
  const [showRunLoader, setRunLoader] = useState(false);

  // delay showing loader for 0.2s so it has enough time to load the data first
  useEffect(() => {
    // for single run
    if (isRunDataLoading && !enableComparisonView) {
      const showSingleRunLoaderTimer = setTimeout(() => {
        setShowSingleRunLoader(true);
      }, 200);

      return () => clearTimeout(showSingleRunLoaderTimer);
    } else {
      setShowSingleRunLoader(false);
    }

    // for multiple runs when the comparison mode is active
    if (isRunDataLoading && newRunAdded) {
      const showRunLoaderTimer = setTimeout(() => {
        setRunLoader(true);
      }, 200);

      return () => clearTimeout(showRunLoaderTimer);
    } else {
      setRunLoader(false);
    }
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
        <SingleRunMetadataLoader theme={theme} />
        <SingleRunDatasetLoader theme={theme} />
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
